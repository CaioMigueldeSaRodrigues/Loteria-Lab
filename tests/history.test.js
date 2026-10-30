import test from "node:test";
import assert from "node:assert/strict";
import {validateHistoricalSnapshot,requireVerifiedHistory} from "../src/history.js";

const fixture=()=>({
  schemaVersion:1,
  modality:"megasena",
  source:{publisher:"Fonte de teste",verification:"pending"},
  collectedAt:"2026-10-30T12:00:00Z",
  firstContest:1,
  lastContest:2,
  recordCount:2,
  records:[
    {contest:1,date:"1996-03-11",numbers:[4,5,30,33,41,52]},
    {contest:2,date:"1996-03-18",numbers:[9,22,29,33,45,54]}
  ]
});
test("valida um snapshot estruturalmente íntegro, sem confundi-lo com fonte verificada",()=>{
  const f=fixture();const parsed=validateHistoricalSnapshot(f);
  assert.equal(parsed.metadata.recordCount,2);
  assert.deepEqual(parsed.records[0].numbers,[4,5,30,33,41,52]);
  assert.throws(()=>requireVerifiedHistory(f),/não foi verificado/);
});
test("rejeita lacunas, números de concurso duplicados e quantidade parcial",()=>{
  const f=fixture();f.records[1].contest=3;
  assert.throws(()=>validateHistoricalSnapshot(f),/Lacuna/);
  f.records[1].contest=1;
  assert.throws(()=>validateHistoricalSnapshot(f),/Lacuna/);
  f.records[1].contest=2;f.lastContest=3;
  assert.throws(()=>validateHistoricalSnapshot(f),/incompleto/);
});
test("rejeita datas impossíveis e dezenas inválidas",()=>{
  const f=fixture();f.records[1].date="2026-02-30";
  assert.throws(()=>validateHistoricalSnapshot(f),/data inválida/);
  f.records[1].date="1996-03-18";f.records[1].numbers=[1,1,3,4,5,6];
  assert.throws(()=>validateHistoricalSnapshot(f),/Seis dezenas distintas/);
});
test("verificação estrutural não equivale a comprovação de origem",()=>{
  const f=fixture();
  f.source.verification="verified";
  assert.equal(requireVerifiedHistory(f).metadata.publisher,"Fonte de teste");
  // Teste da veracidade externa da fonte pertence ao pipeline de ingestão.
});
