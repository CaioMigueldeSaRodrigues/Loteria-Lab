import test from "node:test";
import assert from "node:assert/strict";
import {MODALITIES,validDate,validateArchive,analyze} from "../src/analysis.js";

function fixture(code){
  const {size}=MODALITIES[code];
  const records=[{contest:1,draw_date:"2026-10-01",numbers:Array.from({length:size},(_,i)=>i+1)},
    {contest:2,draw_date:"2026-10-02",numbers:Array.from({length:size},(_,i)=>i+2)}];
  const dataset={modality_code:code,verification_state:"verified",is_current:true,
    published_at:"2026-10-03T12:00:00Z",verified_at:"2026-10-03T10:00:00Z",
    source_publisher:"Fonte de teste",source_reference:"fixture-local",first_contest:1,last_contest:2,record_count:2};
  return {records,dataset};
}
test("regras distintas da Mega-Sena, Quina e Lotofácil",()=>{
  for(const code of Object.keys(MODALITIES)){
    const {records,dataset}=fixture(code);
    assert.equal(validateArchive(dataset,records,code).length,2);
    const s=analyze(records,code,"all");
    assert.equal(s.count,2);
    assert.equal(s.freq[1],1);
    assert.equal(s.freq[2],2);
    assert.equal(s.parity.reduce((a,b)=>a+b,0),2);
    assert.equal(s.expected,2*MODALITIES[code].size/MODALITIES[code].max);
  }
});
test("validação rejeita base parcial, duplicada, irregular ou não verificada",()=>{
  const {records,dataset}=fixture("quina");
  assert.throws(()=>validateArchive(dataset,records.slice(1),"quina"),/completo/);
  const corrupted=structuredClone(records);corrupted[1].contest=1;
  assert.throws(()=>validateArchive(dataset,corrupted,"quina"),/Lacuna/);
  const repeated=structuredClone(records);repeated[0].numbers[1]=repeated[0].numbers[0];
  assert.throws(()=>validateArchive(dataset,repeated,"quina"),/Registro inválido/);
  dataset.verification_state="pending";
  assert.throws(()=>validateArchive(dataset,records,"quina"),/não está publicada/);
});
test("datas impossíveis não entram no acervo",()=>{
  assert.equal(validDate("2026-02-30"),false);
  assert.equal(validDate("2026-11-12"),true);
  assert.equal(validDate("12/11/2026"),false);
});
test("janela recente atualiza contagens sem alterar o sorteio registrado",()=>{
  const {records}=fixture("megasena");
  const a=analyze(records,"megasena",1);
  assert.equal(a.count,1);
  assert.equal(a.first,2);
  assert.equal(a.freq[1],0);
  assert.equal(a.freq[7],1);
  assert.equal(a.delay[7],0);
});
