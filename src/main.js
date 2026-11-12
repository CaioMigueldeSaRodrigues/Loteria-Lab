import {MODALITIES,validateArchive,analyze} from "./analysis.js";

// Publishable key: designed for browser access. RLS restricts the dataset to
// verified public releases. Never use a service_role or secret key here.
const SUPABASE_URL="https://yafgjhloxphtfrgmpwvd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_-aPr6X1ml5KUSqlvzXYj2g_EPEcwUxl";
const el=id=>document.getElementById(id);
const integer=n=>new Intl.NumberFormat("pt-BR").format(n);
const decimal=n=>new Intl.NumberFormat("pt-BR",{maximumFractionDigits:1}).format(n);
const date=s=>s?new Date(s).toLocaleDateString("pt-BR",{timeZone:"UTC"}):"—";
let code="megasena";
let currentDataset=null,records=null,sequence=0;
const apiHeaders={"apikey":SUPABASE_PUBLISHABLE_KEY,"Accept":"application/json"};

async function query(table,params){
  const url=SUPABASE_URL+"/rest/v1/"+table+"?"+params.toString();
  const response=await fetch(url,{headers:apiHeaders,cache:"no-store"});
  if(!response.ok)throw Error("Consulta à base não disponível (HTTP "+response.status+").");
  const result=await response.json();
  if(!Array.isArray(result))throw Error("Resposta inválida da base de dados.");
  return result;
}
async function getVerifiedDataset(modality){
  const q=new URLSearchParams({
    select:"id,modality_code,source_publisher,source_reference,collected_at,verified_at,published_at,verification_state,is_current,first_contest,last_contest,record_count",
    modality_code:"eq."+modality,is_current:"eq.true",limit:"1"
  });
  const found=await query("lottery_datasets",q);
  return found[0]??null;
}
async function getRecords(dataset){
  const all=[];
  const pageSize=500;
  for(let offset=0;offset<dataset.record_count;offset+=pageSize){
    const q=new URLSearchParams({select:"contest,draw_date,numbers",
      dataset_id:"eq."+dataset.id,order:"contest.asc",limit:String(pageSize),offset:String(offset)});
    const part=await query("lottery_draws",q);
    all.push(...part);
    if(part.length<pageSize)break;
  }
  return all;
}
function updateState(message,status=""){
  el("source-state").textContent=status==="ready"?"HISTÓRICO VERIFICADO":status==="issue"?"DADOS INDISPONÍVEIS":"CONSULTANDO DADOS";
  el("source-state").className="source-state "+status;
  el("data-status").textContent=message;
}
function clearDisplay(){
  for(const id of ["stat-contests","stat-average","stat-expected","stat-latest"])el(id).textContent="—";
  el("stat-period").textContent="Aguardando dados";
  el("stat-updated").textContent="Sem versão verificada";
  el("number-grid").replaceChildren(Object.assign(document.createElement("p"),{className:"no-data",textContent:"Os indicadores ficam indisponíveis até a publicação do histórico verificado."}));
  el("parity-chart").replaceChildren(Object.assign(document.createElement("p"),{className:"no-data",textContent:"Aguardando histórico verificado."}));
  el("source-details").textContent="Origem, data e versão serão mostradas após validação.";
  el("number-insight").textContent="Selecione uma dezena para ver seu indicador.";
}
function showStats(){
  if(!records||!currentDataset){clearDisplay();return;}
  const config=MODALITIES[code],windowSize=el("window-select").value;
  const metrics=analyze(records,code,windowSize);
  const metric=el("metric-select").value;
  el("stat-contests").textContent=integer(metrics.count);
  el("stat-average").textContent=decimal(metrics.average);
  el("stat-expected").textContent=decimal(metrics.expected);
  el("stat-latest").textContent=integer(records.at(-1).contest);
  el("stat-period").textContent="Concursos "+integer(metrics.first)+" a "+integer(metrics.last);
  el("stat-updated").textContent="Coleta em "+date(currentDataset.collected_at);
  el("source-details").textContent=currentDataset.source_publisher+" · "+currentDataset.source_reference+" · Verificação: "+date(currentDataset.verified_at);
  const root=el("number-grid");
  root.replaceChildren();
  const values=metrics[metric==="freq"?"freq":metric==="rate"?"rate":"delay"].slice(1);
  const avg=metric==="freq"?metrics.expected:metric==="rate"?100*config.size/config.max:values.reduce((a,b)=>a+b,0)/values.length;
  for(let n=1;n<=config.max;n++){
    const v=values[n-1];
    const btn=document.createElement("button");
    btn.type="button";
    const color=metric==="delay"?"":v>avg*1.12?"high":v<avg*.88?"low":"";
    btn.className="number-cell "+color;
    const heading=document.createElement("strong");heading.textContent=String(n).padStart(2,"0");
    const label=document.createElement("small");
    label.textContent=metric==="freq"?integer(v):metric==="rate"?decimal(v)+"%":integer(v);
    btn.append(heading,label);
    btn.setAttribute("aria-label","Dezena "+n+": "+label.textContent+" na métrica selecionada");
    btn.addEventListener("click",()=>{
      root.querySelectorAll(".selected").forEach(node=>node.classList.remove("selected"));
      btn.classList.add("selected");
      el("number-insight").textContent="Dezena "+String(n).padStart(2,"0")+
        ": "+integer(metrics.freq[n])+" ocorrências em "+integer(metrics.count)+
        " concursos ("+decimal(metrics.rate[n])+"%); intervalo desde a última ocorrência: "+
        integer(metrics.delay[n])+" concursos nesta janela. Indicadores históricos não são previsão.";
    });
    root.append(btn);
  }
  const chart=el("parity-chart");chart.replaceChildren();
  const peak=Math.max(1,...metrics.parity);
  for(let i=0;i<=config.size;i++){
    const row=document.createElement("div");row.className="bar-line";
    const name=document.createElement("span");name.textContent=i+" pares";
    const track=document.createElement("div");track.className="bar-track";
    const bar=document.createElement("span");bar.className="bar-fill";bar.style.width=(100*metrics.parity[i]/peak)+"%";
    track.append(bar);
    const value=document.createElement("span");value.className="bar-value";value.textContent=integer(metrics.parity[i])+" ("+decimal(100*metrics.parity[i]/metrics.count)+"%)";
    row.append(name,track,value);chart.append(row);
  }
  el("number-insight").textContent="Explore a métrica por dezena. Uma variação histórica não implica vantagem em sorteios futuros.";
}
async function load(modality){
  const request=++sequence;
  records=null;currentDataset=null;clearDisplay();
  updateState("Consultando a base publicada de "+MODALITIES[modality].name+".");
  try{
    const dataset=await getVerifiedDataset(modality);
    if(request!==sequence)return;
    if(!dataset){
      updateState("Não há histórico integral verificado e publicado para "+MODALITIES[modality].name+". Nenhum resultado fictício será exibido.","issue");
      return;
    }
    if(dataset.record_count>100000)throw Error("Limite de segurança de registros excedido.");
    const rows=await getRecords(dataset);
    if(request!==sequence)return;
    validateArchive(dataset,rows,modality);
    records=rows;currentDataset=dataset;
    updateState(integer(rows.length)+" concursos íntegros encontrados. Fonte: "+dataset.source_publisher+".","ready");
    showStats();
  }catch(error){
    if(request!==sequence)return;
    records=null;currentDataset=null;clearDisplay();
    updateState("Não foi possível confirmar o histórico de "+MODALITIES[modality].name+": "+error.message,"issue");
  }
}
document.querySelectorAll("[data-modality]").forEach(button=>{
  button.addEventListener("click",()=>{
    code=button.dataset.modality;
    document.querySelectorAll("[data-modality]").forEach(b=>{
      b.classList.toggle("active",b===button);
      b.setAttribute("aria-pressed",String(b===button));
    });
    el("window-select").value="all";
    el("metric-select").value="freq";
    load(code);
  });
});
el("window-select").addEventListener("change",showStats);
el("metric-select").addEventListener("change",showStats);
load(code);
