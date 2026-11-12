# Publicação Lotolab — estado verificável

## Produção

O projeto Vercel deve acompanhar a branch `main`, com `npm run build`, saída `dist` e `Root Directory = ./`.

A aplicação publicada é um **site comercial de análises históricas**: marca, navegação, modalidades, indicadores, metodologia e condições de planos. **Não** gera números para apostas, não aceita apostas, não simula sorteios na interface e não processa pagamentos.

## Condições de dados reais

O frontend consulta `public.lottery_datasets` e `public.lottery_draws` no projeto Supabase Lotolab, sob RLS. Cada consulta só pode exibir registros de versão publicada, atual e verificada. A validação adicional exige sequência integral desde o concurso 1, datas válidas e dezenas compatíveis com a modalidade.

Enquanto não houver histórico completo **verificado e publicado** de Mega-Sena, Quina ou Lotofácil, o painel dessa modalidade exibirá o aviso de indisponibilidade, nunca dados fictícios.

## Oferta

- Essencial: preço de referência R$ 14,90/semana.
- Avançado: preço de referência R$ 29,90/semana.

A precificação está exibida para informação; **assinaturas e cobrança não estão ativas**, pois ainda não há autenticação, checkout, recorrência, webhooks e governança de plano implementados. Não indicar essas funcionalidades como prontas.

## Verificação de publicação

1. Testes unitários `npm test`.
2. Build `npm run build`.
3. Playwright `npm run test:e2e` desktop e 390px mobile.
4. Inspecionar o deployment de produção no painel da Vercel e confirmar o código HTTP da rota raiz.
5. Verificar ausências de dados e errors HTTP da API.
6. Confirmar que nenhuma chave `service_role` aparece no frontend.
7. Conferir que a `main` contém o commit aprovado.

Nenhuma URL `.vercel.app` é considerada publicada sem comprovação da Vercel ou resposta HTTPS validada.
