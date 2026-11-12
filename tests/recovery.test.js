import test from "node:test";
import assert from "node:assert/strict";
import {extractAuthRedirect} from "../src/auth.js";

test("recovery fragment is accepted only with token",()=>{
  const r=extractAuthRedirect("#access_token=temporary&type=recovery");
  assert.equal(r.type,"recovery");
  assert.equal(r.access_token,"temporary");
  assert.equal(extractAuthRedirect("#type=recovery").type,"none");
});
test("account-confirmation fragment becomes a login session",()=>{
  const r=extractAuthRedirect("#type=signup&access_token=abc&refresh_token=xyz&expires_in=1200");
  assert.equal(r.type,"login");assert.equal(r.expires_in,1200);
});
test("error fragment reports invalid link without a token",()=>{
  assert.equal(extractAuthRedirect("#error=access_denied&error_description=Expired").type,"error");
});
