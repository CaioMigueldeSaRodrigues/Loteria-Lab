# Autenticação e segregação comercial

O Lotolab utiliza Supabase Auth (e-mail e senha) e a tabela `public.lotolab_analysis_access`. O cliente pode criar uma conta, mas **cadastro não gera assinatura**.

- Visitante: consulta página comercial, metodologia e preços, sem acesso ao histórico.
- Autenticado sem assinatura ativa: não obtém resultados protegidos.
- Essencial ativo: consulta apenas séries verificadas sob RLS; ferramentas básicas de frequência, paridade e períodos.
- Avançado ativo: mesmas séries e função `lotolab_advanced_comparison`, que valida a assinatura no PostgreSQL em cada chamada.

Segurança: consultas à base histórica não têm permissão `anon`; assinatura é verificada por `auth.uid()`, status `active`, `valid_from <= now()`, `valid_until > now()`. Browser tem apenas chave publicável; nenhuma chave secreta é inserida no código. Usuários não podem criar ou estender a própria assinatura.

Sessões ficam somente na sessão da aba do navegador (sessionStorage), com atualização de token de acesso e opção de sair. A confirmação de e-mail poderá ser exigida pelo Supabase; o envio de e-mail requer configuração real do provedor e, para produção, SMTP adequado. Não desativar verificação de conta apenas para contornar entrega de mensagens.

O checkout, a concessão de direitos por webhooks de pagamento e a verificação de históricos completos ainda não foram implementados. **Não atribuir assinaturas manualmente sem verificar sua origem e validade.**

Antes de aceitar clientes pagantes, configurar endereço de redirecionamento e `Site URL` no painel Supabase Auth para o domínio público definitivo, validar e-mails, política de privacidade, termos e faturamento.
