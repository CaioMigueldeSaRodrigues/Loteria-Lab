import {test,expect} from "@playwright/test";
const dataset={id:"ba4e8a82-5cdf-4d13-94d5-44896d6ec401",modality_code:"megasena",
 source_publisher:"Fonte de teste",source_reference:"fixture-local",
 collected_at:"2026-10-05T10:00:00Z",verified_at:"2026-10-05T11:00:00Z",
 published_at:"2026-10-05T12:00:00Z",verification_state:"verified",is_current:true,
 first_contest:1,last_contest:2,record_count:2};
const draws=[{contest:1,draw_date:"2026-10-01",numbers:[1,2,3,4,5,6]},
 {contest:2,draw_date:"2026-10-02",numbers:[2,3,4,5,6,7]}];
test.beforeEach(async({page})=>{
  await page.route("**/rest/v1/lottery_datasets?**",async route=>route.fulfill({status:200,contentType:"application/json",body:"[]"}));
  await page.route("**/rest/v1/lottery_draws?**",async route=>route.fulfill({status:200,contentType:"application/json",body:"[]"}));
});
test("comercial real sem demonstrações, uploads ou cobrança falsa",async({page})=>{
  await page.goto("/");
  await expect(page.getByRole("heading",{name:/DADOS REAIS/})).toBeVisible();
  await expect(page.getByText("R$ 14,90")).toBeVisible();
  await expect(page.getByText("R$ 29,90")).toBeVisible();
  await expect(page.locator("#data-status")).toContainText("Não há histórico integral verificado");
  await expect(page.locator("#number-grid .number-cell")).toHaveCount(0);
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await expect(page.getByText(/Nenhuma cobrança é efetuada/)).toBeVisible();
});
test("troca de modalidade não apresenta valores inventados",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:"Lotofácil"}).click();
  await expect(page.locator("#data-status")).toContainText("Lotofácil");
  await expect(page.locator("#stat-contests")).toHaveText("—");
  await expect(page.getByRole("button",{name:"Lotofácil"})).toHaveAttribute("aria-pressed","true");
});
test("apresenta métricas exclusivamente após receber conjunto íntegro verificado",async({page})=>{
  await page.route("**/rest/v1/lottery_datasets?**",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify([dataset])}));
  await page.route("**/rest/v1/lottery_draws?**",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(draws)}));
  await page.goto("/");
  await expect(page.locator("#stat-contests")).toHaveText("2");
  await expect(page.locator("#number-grid .number-cell")).toHaveCount(60);
  await expect(page.locator("#parity-chart .bar-line")).toHaveCount(7);
  await page.locator("#number-grid .number-cell").first().click();
  await expect(page.locator("#number-insight")).toContainText("Dezena 01");
  await page.locator("#window-select").selectOption("50");
  await expect(page.locator("#stat-contests")).toHaveText("2");
});
test("mobile sem overflow horizontal",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await expect(page.getByRole("heading",{name:/DADOS REAIS/})).toBeVisible();
  const widths=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,screen:innerWidth}));
  expect(widths.doc).toBeLessThanOrEqual(widths.screen+1);
});
