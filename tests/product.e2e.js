import {test,expect} from "@playwright/test";

const example="concurso;data;bola1;bola2;bola3;bola4;bola5;bola6\n1;11/03/1996;04;05;30;33;41;52\n2;18/03/1996;10;11;12;13;14;15";

test("primeira visita: benefícios e limitações claras",async({page},testInfo)=>{
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading",{name:/Transforme números em conhecimento/i})).toBeVisible();
  await expect(page.getByText("DADOS SIMULADOS")).toHaveCount(0);
  await expect(page.locator("#kpi-draws")).toHaveText("—");
  await expect(page.getByText(/não há aumento demonstrado da chance/i)).toBeVisible();
  await page.screenshot({path:testInfo.outputPath("homepage-desktop.png"),fullPage:true});
  expect(errors).toEqual([]);
});

test("demonstração é identificada e mapa contém 60 dezenas",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:/Testar demonstração/i}).click();
  await expect(page.locator("#source-tag")).toHaveText("DADOS SIMULADOS");
  await expect(page.locator("#kpi-draws")).toHaveText("350");
  await expect(page.locator("#number-grid .heat-cell")).toHaveCount(60);
  await page.locator("#number-grid .heat-cell").first().click();
  await expect(page.locator("#number-insight")).toContainText("Dezena 1:");
  await page.locator("#window-select").selectOption("25");
  await expect(page.locator("#number-grid .heat-cell")).toHaveCount(60);
});

test("importação por texto aceita CSV e mostra métricas",async({page})=>{
  await page.goto("/");
  await page.locator("#paste-input").fill(example);
  await page.locator("#paste-btn").click();
  await expect(page.locator("#source-tag")).toHaveText("DADOS IMPORTADOS");
  await expect(page.locator("#kpi-draws")).toHaveText("2");
  await expect(page.locator("#kpi-latest")).toHaveText("2");
  await expect(page.locator("#number-grid .heat-cell")).toHaveCount(60);
  await expect(page.locator("#parity-chart .chart-col")).toHaveCount(7);
  await expect(page.locator("#sum-chart .chart-col")).toHaveCount(7);
});

test("importação por arquivo e rejeição de duplicatas",async({page})=>{
  await page.goto("/");
  const bad=example+"\n2;25/03/1996;01;02;03;04;05;06";
  await page.locator("#file-input").setInputFiles({name:"historico.csv",mimeType:"text/csv",buffer:Buffer.from(bad)});
  await expect(page.locator("#kpi-draws")).toHaveText("2");
  await expect(page.locator("#import-feedback")).toContainText("1 linhas rejeitadas");
});

test("simulação mostra sete resultados e média reproduzível",async({page})=>{
  await page.goto("/");
  await page.locator("#trials-select").selectOption("1000");
  await page.locator("#simulate-btn").click();
  await expect(page.locator("#simulation-chart .sim-row")).toHaveCount(7);
  await expect(page.locator("#sim-status")).toContainText("1.000 experimentos");
  await expect(page.locator("#simulation-detail")).toContainText("Média teórica: 0,600");
});

test("experiência móvel sem rolagem horizontal",async({page},testInfo)=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await expect(page.getByRole("heading",{name:/Transforme números em conhecimento/i})).toBeVisible();
  await page.getByRole("button",{name:/Testar demonstração/i}).click();
  const widths=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  expect(widths.doc).toBeLessThanOrEqual(widths.viewport+1);
  await page.screenshot({path:testInfo.outputPath("homepage-mobile.png"),fullPage:true});
});
