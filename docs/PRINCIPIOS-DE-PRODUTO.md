# Loteria Lab — princípios de produto

Objetivo: oferecer análises históricas educacionais e experiências estatísticas claras, comercializáveis e baseadas em registros auditáveis.

## Proposta de valor
- Histórico integrado automaticamente, com fonte, cobertura, integridade e última atualização.
- Mega-Sena, Lotofácil e Quina com parâmetros e modelos matemáticos específicos.
- Painéis de frequências, atrasos históricos, distribuição, paridade, somas, janelas temporais e comparações.
- Simulações reproduzíveis para entender acaso, incerteza e limitações de inferência.
- Interface intuitiva, acessível e responsiva; sem upload pelo cliente.

## Não prometer
Dados passados não predizem o próximo sorteio, frequência não aumenta a chance futura e atraso não significa que uma dezena está prestes a sair. Não oferecer recomendação de apostas, geração de combinações para apostar nem promessas de premiação.

## Critérios obrigatórios antes de qualquer modificação
1. Qual problema do cliente resolvemos e qual benefício aparece na tela?
2. A melhoria ajuda a explicar resultados e probabilidades sem induzir interpretação enganosa?
3. Quais dados reais e conferidos sustentam a funcionalidade?
4. Como o usuário utiliza o recurso sem passos desnecessários?
5. Como testamos a exatidão, acessibilidade, desempenho e segurança?
6. Qual impacto em retenção, valor percebido e custos operacionais?

## Monetização
Monetizar informação e funcionalidade: análises avançadas, filtros temporais, comparações entre modalidades e relatórios explicativos. Não monetizar apostas ou promessas de ganhos.

## Diretrizes técnicas
Usar estruturas seguras no Supabase, RLS em tabelas expostas, apenas leitura pública de resultados verificados e versionados; não expor credenciais sensíveis. Atualizações devem preservar últimas versões íntegras e reportar erros. Não anunciar a carga de históricos como concluída até ser auditada.

## Definição de pronto
Toda alteração tem benefício descrito, aceitação mensurável, testes automáticos, validação desktop/mobile, indicação de origem dos dados e documentação.
