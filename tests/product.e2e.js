import {test,expect} from "@playwright/test";
const base="https://yafgjhloxphtfrgmpwvd.supabase.co";
const user={id:"25c57010-fc48-447c-9920-a10dc7d0b127",email:"teste@example.invalid"};
const dataset={id:"ba4e8a82-5cdf-4d13-94d5-44896d6ec401",modality_code:"megasena",
source_publisher:"Fonte de teste",source_reference:"fixture-local",
collected_at:"2026-10-05T10:00:00Z",verified_at:"2026-10-05T11:00:00Z",
published_at:"2026-10-05T12:00:00Z",verification_state:"verified",is_current:true,
first_contest:1,last_contest:2,record_count:2};
const draws=[{contest:1,draw_date:"2026-10-01",numbers:[1,2,3,4,5,6]},
{contest:2,draw_date:"2026-10-02",numbers:[2,3,4,5,6,7]}];

async function mockBackend(page,plan=null){
  await page.route("**/auth/v1/token?grant_type=password",route=>route.fulfill({status:200,
    contentType:"application/json",body:JSON.stringify({access_token:"test-token",refresh_token:"test-refresh",expires_in:3600,user})}));
  await page.route("**/auth/v1/user",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(user)}));
  await page.route("**/rest/v1/lotolab_analysis_access?**",route=>route.fulfill({status:200,contentType:"application/json",
    body:JSON.stringify(plan?[{plan,access_status:"active",valid_from:"2020-01-01T00:00:00Z",valid_until:"2099-01-01T00:00:00Z"}]:[])}));
  await page.route("**/rest/v1/lottery_datasets?**",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify([dataset])}));
  await page.route("**/rest/v1/lottery_draws?**",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(draws)}));
  await page.route("**/rest/v1/rpc/lotolab_advanced_comparison",route=>route.fulfill({status:200,contentType:"application/json",
    body:JSON.stringify({available:true,historical_count:2,recent_count:2,historical_mean_sum:23,recent_mean_sum:23})}));
}
async function login(page){
  await page.locator("#account-email").fill("teste@example.invalid");
  await page.locator("#account-password").fill("test-password-123");
  await page.getByRole("button",{name:"Entrar",exact:true}).click();
}
test("visitante pode conhecer preços mas não acessar análises protegidas",async({page})=>{
  await mockBackend(page);
  await page.goto("/");
  await expect(page.getByText("R$ 14,90")).toBeVisible();
  await expect(page.getByText("R$ 29,90")).toBeVisible();
  await expect(page.locator("#analytics-content")).toBeVisible();
  await expect(page.locator("#number-grid .number-cell-placeholder")).toHaveCount(60);
  await expect(page.locator("#advanced-teaser")).toBeVisible();
  await expect(page.locator("input[type=file]")).toHaveCount(0);
});
test("conta sem assinatura ativa não recebe acesso",async({page})=>{
  await mockBackend(page);
  await page.goto("/");
  await login(page);
  await expect(page.locator("#account-plan")).toContainText("Nenhuma assinatura ativa");
  await expect(page.locator("#analytics-content")).toBeVisible();
  await expect(page.locator("#number-grid .number-cell-placeholder")).toHaveCount(60);
});
test("plano Essencial recebe painel mas não comparação Avançada",async({page})=>{
  await mockBackend(page,"essential");
  await page.goto("/");
  await login(page);
  await expect(page.locator("#analytics-content")).toBeVisible();
  await expect(page.locator("#stat-contests")).toHaveText("2");
  await expect(page.locator("#number-grid .number-cell")).toHaveCount(60);
  await expect(page.locator("#number-grid .number-cell-placeholder")).toHaveCount(0);
  await expect(page.locator("#advanced-panel")).toBeHidden();
});
test("plano Avançado libera comparação calculada no banco",async({page})=>{
  await mockBackend(page,"advanced");
  await page.goto("/");
  await login(page);
  await expect(page.locator("#advanced-panel")).toBeVisible();
  await expect(page.locator("#advanced-teaser")).toBeHidden();
  await page.getByRole("button",{name:"Calcular comparação"}).click();
  await expect(page.locator("#advanced-result")).toContainText("Histórico completo");
});
test("mobile sem rolagem horizontal",async({page})=>{
  await mockBackend(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await expect(page.getByRole("heading",{name:/DADOS REAIS/})).toBeVisible();
  const x=await page.evaluate(()=>({width:document.documentElement.scrollWidth,screen:innerWidth}));
  expect(x.width).toBeLessThanOrEqual(x.screen+1);
});
