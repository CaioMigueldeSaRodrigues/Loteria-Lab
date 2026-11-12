import {MODALITIES,validateArchive,analyze} from "./analysis.js";
import {signIn,signUp,signOut,restoreSession,verifyUser,fetchEntitlement,getAccessToken,clearSession,sessionEmail,planAllows,fetchAdvancedComparison,SUPABASE_URL,SUPABASE_PUBLIC_KEY} from "./auth.js";

// Publishable key: designed for browser access. RLS restricts the dataset to
// verified public releases. Never use a service_role or secret key here.

const el=id=>document.getElementById(id);
const integer=n=>new Intl.NumberFormat("pt-BR").format(n);
const decimal=n=>new Intl.NumberFormat("pt-BR",{maximumFractionDigits:1}).format(n);
const date=s=>s?new Date(s).toLocaleDateString("pt-BR",{timeZone:"UTC"}):"—";
let code="megasena";
let currentDataset=null,records=null,sequence=0;
let entitlement=null;
const hasBasic=()=>planAllows(entitlement?.plan,"basic");
const hasAdvanced=()=>planAllows(entitlement?.plan,"advanced");
const apiHeaders={"apikey":SUPABASE_PUBLIC_KEY,"Accept":"application/json"};

async function query(table,params){
  const url=SUPABASE_URL+"/rest/v1/"+table+"?"+params.toString();
  const token=await getAccessToken();
  if(!token)throw Error("Sua sessão expirou. Entre novamente.");
  const response=await fetch(url,{headers:{...apiHeaders,Authorization:"Bearer "+token},cache:"no-store"});
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
  const preview=el("number-grid");
  preview.replaceChildren();
  // Number labels are the game's defined range, NOT invented contest results.
  for(let n=1;n<=MODALITIES[code].max;n++){
    const cell=document.createElement("span");
    cell.className="number-cell number-cell-placeholder";
    cell.setAttribute("aria-label","Dezena "+n+"; estatística indisponível");
    const label=document.createElement("strong");label.textContent=String(n).padStart(2,"0");
    const unavailable=document.createElement("small");unavailable.textContent="—";
    cell.append(label,unavailable);preview.append(cell);
  }
  const chart=el("parity-chart");
  chart.replaceChildren();
  for(let i=0;i<=MODALITIES[code].size;i++){
    const row=document.createElement("div");row.className="bar-line bar-line-placeholder";
    const name=document.createElement("span");name.textContent=i+" pares";
    const track=document.createElement("div");track.className="bar-track";
    const dash=document.createElement("span");dash.textContent="—";dash.className="bar-value";
    row.append(name,track,dash);chart.append(row);
  }
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
  if(hasAdvanced())el("advanced-result").textContent="Para comparar períodos, execute a análise no servidor.";
}
async function load(modality){
  const request=++sequence;
  if(!hasBasic()){clearDisplay();updateState("Painel de "+MODALITIES[modality].name+": acesso aos resultados reservado a assinantes ativos.","issue");return;}
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
function authView(message){
  const signedIn=Boolean(sessionEmail());
  el("account-form").hidden=signedIn;
  el("account-signed-in").hidden=!signedIn;
  el("account-status").textContent=signedIn?(entitlement?"ASSINATURA ATIVA":"SEM ASSINATURA ATIVA"):"NÃO AUTENTICADO";
  el("account-identity").textContent=signedIn?sessionEmail():"";
  el("account-plan").textContent=entitlement
    ?(entitlement.plan==="advanced"?"Plano Avançado":"Plano Essencial")+" · até "+new Date(entitlement.valid_until).toLocaleDateString("pt-BR")
    :"Nenhuma assinatura ativa vinculada à conta";
  // Always display the analytical layout; the database continues to enforce access.
  el("analytics-content").hidden=false;
  el("advanced-teaser").hidden=hasAdvanced();
  el("access-guard").hidden=hasBasic();
  el("advanced-panel").hidden=!hasAdvanced();
  el("account-feedback").textContent=message||(hasBasic()?"Sua assinatura está ativa. Explore as análises disponíveis.":"A consulta exige uma assinatura ativa. O checkout ainda não está disponível.");
  if(!hasBasic()){
    records=null;currentDataset=null;sequence++;clearDisplay();
    updateState("Visualização da estrutura do painel. Entre com uma assinatura ativa para consultar os resultados reais de "+MODALITIES[code].name+".","issue");
  }
}
async function checkAccess(){
  el("account-feedback").textContent="Validando sessão e permissões...";
  try{
    const user=await verifyUser();
    if(!user){entitlement=null;authView("Entre ou crie sua conta para consultar as assinaturas.");return;}
    entitlement=await fetchEntitlement();
    authView();
    if(hasBasic())await load(code);
  }catch(error){
    entitlement=null;
    authView("Não foi possível validar as permissões: "+error.message);
  }
}
el("account-form").addEventListener("submit",async event=>{
  event.preventDefault();
  const email=el("account-email").value.trim(),password=el("account-password").value;
  const button=el("sign-in-btn");button.disabled=true;
  try{
    await signIn(email,password);
    el("account-password").value="";
    await checkAccess();
  }catch(error){el("account-feedback").textContent="Falha ao entrar: "+error.message;}
  finally{button.disabled=false;}
});
el("sign-up-btn").addEventListener("click",async()=>{
  const email=el("account-email").value.trim(),password=el("account-password").value;
  if(!el("account-form").reportValidity())return;
  const button=el("sign-up-btn");button.disabled=true;
  try{
    const result=await signUp(email,password);
    el("account-password").value="";
    if(result.signedIn)await checkAccess();
    else el("account-feedback").textContent=result.message;
  }catch(error){el("account-feedback").textContent="Falha no cadastro: "+error.message;}
  finally{button.disabled=false;}
});
el("sign-out-btn").addEventListener("click",async()=>{
  await signOut();entitlement=null;authView("Sessão encerrada.");
});
el("refresh-access-btn").addEventListener("click",checkAccess);
el("advanced-compare").addEventListener("click",async()=>{
  if(!hasAdvanced()||!records)return;
  const btn=el("advanced-compare");btn.disabled=true;
  el("advanced-result").textContent="Calculando comparação autorizada...";
  try{
    const result=await fetchAdvancedComparison(code,Number(el("advanced-window").value));
    el("advanced-result").textContent=result.available
      ? "Histórico completo ("+integer(result.historical_count)+" concursos): média "+decimal(result.historical_mean_sum)
        +" · últimos "+integer(result.recent_count)+" concursos: média "+decimal(result.recent_mean_sum)+"."
      :"Ainda não existe um histórico verificado para esta modalidade.";
  }catch(error){el("advanced-result").textContent=error.message;}
  finally{btn.disabled=false;}
});
if(restoreSession())checkAccess();
else authView("Entre ou crie uma conta. Nenhum plano é concedido automaticamente.");
el("window-select").addEventListener("change",showStats);
el("metric-select").addEventListener("change",showStats);
