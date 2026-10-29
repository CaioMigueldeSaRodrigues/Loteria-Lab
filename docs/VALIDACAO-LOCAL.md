# Validação local do Loteria Lab

Este roteiro valida a experiência **educacional**, sem apostas, pagamentos ou previsões.

## Preparação

- Windows com Node.js 20 ou superior instalado.
- Extrair a branch `feat/mvp-educacional` do repositório.
- Dar dois cliques no arquivo `validar-local.cmd` na raiz do projeto.
- Abrir **http://127.0.0.1:5173** no Chrome, Edge ou Firefox.

> Se o navegador mostrar página indisponível, confirme que a janela do servidor está aberta. Não abra `index.html` diretamente pelo explorador: os módulos JavaScript usam HTTP.

## Roteiro de aceitação

- [ ] A página inicial carrega sem erros, com textos e botões legíveis.
- [ ] A etiqueta inicial é **SEM DADOS**, sem estatísticas inventadas.
- [ ] Em **Testar demonstração**, a etiqueta muda para **DADOS SIMULADOS** e aparecem 350 registros fictícios.
- [ ] O mapa contém exatamente 60 dezenas; selecionar uma exibe sua frequência.
- [ ] O filtro **Últimos 25** atualiza os valores do mapa.
- [ ] Em **Laboratório**, executar 1.000 experimentos produz o gráfico com resultados de 0 a 6 coincidências.
- [ ] Em **Importar histórico**, colar o CSV abaixo retorna **2** registros.
- [ ] No celular ou na emulação mobile do navegador (390 × 844), a página não apresenta rolagem horizontal.
- [ ] Os avisos sobre dados sintéticos e limitações continuam visíveis.

## Dados de teste (fictícios)

```csv
concurso;data;bola1;bola2;bola3;bola4;bola5;bola6
1;11/03/1996;04;05;30;33;41;52
2;18/03/1996;10;11;12;13;14;15
```

Os valores acima são apenas **fixtures de teste**; não devem ser tratados como histórico validado.

## Auditoria automatizada (opcional)

```powershell
npm install
npx playwright install chromium
npm run check
```

O comando `npm run check` executa testes unitários, build e testes E2E de navegador. Os testes E2E geram capturas de tela quando necessário.

## Limites da versão

O MVP atual não contém dataset oficial incorporado, verificação da fonte dos arquivos nem importação XLSX. Também não apresenta capacidade preditiva. Esses pontos não impedem a validação local dos fluxos existentes, mas impedem classificar o produto como completamente homologado.
