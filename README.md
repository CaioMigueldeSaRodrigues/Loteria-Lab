# Loteria Lab

Laboratório educacional de análise estatística de resultados da Mega-Sena. **Não é uma ferramenta de apostas ou previsão de resultados.**

## Produto

- Painel responsivo de exploração de histórico
- Importação de CSV/TXT no navegador, sem upload para servidores
- Mapa de frequências de 01 a 60
- Distribuições de pares e faixas de soma
- Simulação reprodutível do modelo uniforme 6/60
- Demonstração com 350 registros **sintéticos**, sempre identificados

## Desenvolvimento

Requisitos: Node.js 20+ e Python 3 para servidor local.

```sh
npm test
npm run build
npm run dev
```

Abra http://localhost:5173 no navegador. A versão de produção pode ser publicada em hospedagem estática a partir de `dist/`. Nenhuma dependência de terceiros é necessária.

## Formato de importação

CSV/TXT com cabeçalho opcional:

```csv
concurso;data;bola1;bola2;bola3;bola4;bola5;bola6
1;11/03/1996;04;05;30;33;41;52
```

Aceita também seis dezenas separadas por `;`, `,` ou tabulação em cada linha. Registros com dezenas duplicadas, fora do intervalo ou concursos duplicados são rejeitados. O importador não verifica a autenticidade da fonte.

## Limitações

Não inclui base oficial embutida, importação XLSX, conexão com a Caixa, autenticação, assinatura ou pagamentos. Resultados passados não aumentam a probabilidade de acerto ou demonstram maior chance de ganhar sem dividir. Não há geração de apostas.

## Estado

MVP em revisão. Testes automatizados configurados em GitHub Actions. Executar validação no navegador antes de publicar.
