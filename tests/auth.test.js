import test from "node:test";
import assert from "node:assert/strict";
import {activeEntitlement,planAllows} from "../src/auth.js";

const current=Date.parse("2026-11-12T18:00:00Z");
const row=(plan="essential")=>({plan,access_status:"active",valid_from:"2026-11-12T00:00:00Z",valid_until:"2026-11-19T00:00:00Z"});
test("plano válido com datas vigentes é autorizado",()=>{
  assert.deepEqual(activeEntitlement(row(),current),{plan:"essential",valid_until:"2026-11-19T00:00:00Z"});
  assert.equal(activeEntitlement(row("advanced"),current).plan,"advanced");
});
test("acesso inexistente, vencido ou cancelado não é autorizado",()=>{
  assert.equal(activeEntitlement(null,current),null);
  assert.equal(activeEntitlement({...row(),access_status:"canceled"},current),null);
  assert.equal(activeEntitlement({...row(),valid_until:"2026-11-12T12:00:00Z"},current),null);
  assert.equal(activeEntitlement({...row(),valid_from:"2026-11-13T12:00:00Z"},current),null);
  assert.equal(activeEntitlement({...row(),plan:"admin"},current),null);
});
test("o Essencial não possui permissões Avançadas",()=>{
  assert.equal(planAllows("essential","basic"),true);
  assert.equal(planAllows("essential","advanced"),false);
  assert.equal(planAllows("advanced","advanced"),true);
  assert.equal(planAllows(null,"basic"),false);
});
