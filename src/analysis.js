export const MODALITIES=Object.freeze({
  megasena:{name:"Mega-Sena",size:6,max:60},
  quina:{name:"Quina",size:5,max:80},
  lotofacil:{name:"Lotofácil",size:15,max:25}
});

export function validDate(value){
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const d=new Date(value+"T00:00:00.000Z");
  return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;
}

export function validateArchive(dataset,rows,code){
  const cfg=MODALITIES[code];
  if(!cfg)throw Error("Modalidade não suportada.");
  if(!dataset||dataset.modality_code!==code||
    dataset.verification_state!=="verified"||dataset.is_current!==true||
    !dataset.published_at||!dataset.verified_at||
    typeof dataset.source_publisher!=="string"||
    !dataset.source_publisher.trim()||
    typeof dataset.source_reference!=="string"||
    !dataset.source_reference.trim()){
    throw Error("A versão do histórico não está publicada e verificada.");
  }
  if(!Array.isArray(rows)||!Number.isSafeInteger(dataset.last_contest)||
    dataset.first_contest!==1||dataset.record_count!==dataset.last_contest||
    rows.length!==dataset.record_count){
    throw Error("O histórico não está completo: quantidade ou cobertura divergente.");
  }
  for(let i=0;i<rows.length;i++){
    const row=rows[i];
    if(!row||row.contest!==i+1||!validDate(row.draw_date)||
      !Array.isArray(row.numbers)||row.numbers.length!==cfg.size||
      row.numbers.some(n=>!Number.isInteger(n)||n<1||n>cfg.max)||
      new Set(row.numbers).size!==cfg.size){
      throw Error("Registro inválido ou lacuna no concurso "+(i+1)+".");
    }
  }
  return rows;
}

export function analyze(rows,code,windowSize="all"){
  const cfg=MODALITIES[code];
  if(!cfg||!Array.isArray(rows)||rows.length===0)return null;
  const limit=windowSize==="all"?rows.length:Number(windowSize);
  if(!Number.isSafeInteger(limit)||limit<1)throw Error("Janela inválida.");
  const windowRows=rows.slice(-limit);
  const freq=Array(cfg.max+1).fill(0);
  const delay=Array(cfg.max+1).fill(windowRows.length);
  const parity=Array(cfg.size+1).fill(0);
  let sum=0;
  for(const row of windowRows){
    let evens=0;
    for(const n of row.numbers){
      freq[n]++;
      sum+=n;
      if(n%2===0)evens++;
    }
    parity[evens]++;
  }
  for(let i=windowRows.length-1;i>=0;i--){
    for(const n of windowRows[i].numbers){
      if(delay[n]===windowRows.length)delay[n]=windowRows.length-1-i;
    }
  }
  return {count:windowRows.length,first:windowRows[0].contest,
    last:windowRows[windowRows.length-1].contest,freq,delay,parity,
    average:sum/windowRows.length,expected:windowRows.length*cfg.size/cfg.max,
    rate:freq.map(n=>100*n/windowRows.length)};
}
