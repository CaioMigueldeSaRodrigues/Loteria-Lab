# LOTOLAB

Site comercial de **inteligência estatística histórica**. Repositório GitHub integrado à Vercel; `main` é produção e `feat/mvp-educacional` é desenvolvimento.

## Escopo real publicado

- Layout comercial responsivo e ofertas semanais **planejadas**: Essencial R$ 14,90 e Avançado R$ 29,90.
- Dashboard que consulta exclusivamente conjuntos **publicados e verificados** do Supabase, com três modalidades: Mega-Sena, Quina e Lotofácil.
- Comparação por janelas, frequências, intervalos históricos e paridade.
- Nenhum dado sintético, CSV enviado pelo usuário ou resultado parcial é exposto no site.
- O cliente não consegue contratar ainda: autenticação, pagamento e controle de acesso não estão implementados.
- Sem recomendação de combinações para apostas.

## Fonte de dados

Projeto Supabase: `Loteria-Lab`. Tabelas públicas protegidas por RLS:
`lottery_modalities`, `lottery_datasets`, `lottery_draws`.

Somente registros marcados como verificados e publicados são legíveis pelo frontend. É obrigatório validar **todos** os concursos, suas datas e a proveniência antes de promover uma versão. Não modificar RLS para contornar ausência de dados.

A chave `sb_publishable_` do frontend é pública por definição; **nunca** incluir `service_role` ou chave secreta no repositório ou navegador.

Se ainda não existir um conjunto verificado, a interface sinaliza indisponibilidade. O banco inicial foi criado sem registros.

## Instalação local

Requer Node.js >=20.

```bash
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev
```

Acesse `http://127.0.0.1:5173`.

## Vercel

`vercel.json` define `npm run build` e `dist`. A Vercel deve estar vinculada ao repositório e ter a branch `main` configurada como produção. A conclusão do build GitHub não comprova a publicação na Vercel; confirme no painel de Deployments.

## Pendências comerciais críticas

1. Importação e verificação independente dos históricos integrais por modalidade.
2. Checkout real e recorrência semanal com webhook e validação de pagamentos.
3. Autenticação e autorização dos planos; política de cancelamento, LGPD e suporte.
4. Confirmação do regime tributário e condições comerciais.
5. Revalidação de integração E2E com acervo completo e monitoramento de disponibilidade.

**Não anunciar funcionalidades indisponíveis como prontas nem ativar cobranças sem comprovação do serviço.**
