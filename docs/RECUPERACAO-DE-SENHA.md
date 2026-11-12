# Lotolab — autenticação por e-mail e recuperação de senha

## Fluxos implementados no frontend

1. Cadastro com e-mail/senha pelo Supabase Auth.
2. Confirmação de cadastro por link do Supabase (se exigida nas configurações do projeto).
3. Login com credenciais escolhidas pelo usuário.
4. Ação **Esqueci minha senha**, que envia link de redefinição via Supabase Auth.
5. Após clicar no link, o navegador remove o token da barra de endereço, valida a sessão e solicita nova senha (mínimo de 10 caracteres).
6. Depois de redefinir, o usuário entra novamente.
7. Consulta da assinatura válida por RLS e habilitação das análises conforme o plano.

**Nunca se envia a senha do cliente por e-mail.** O e-mail é o identificador de acesso. O usuário define sua senha por conexão segura ou a redefine usando link temporário.

## Configuração externa pendente

O projeto Supabase precisa de:

- Authentication → URL Configuration → **Site URL**: endereço público definitivo do Lotolab;
- Redirect URLs: incluir a URL de produção e os ambientes de desenvolvimento estritamente necessários;
- Authentication → Email: configurar SMTP de produção, remetente validado, reputação de envio e limites;
- Templates: personalizar confirmação de conta, convite e recuperação, com o nome Lotolab;
- Conferir se a confirmação de e-mail está ativada e executar o fluxo real com um e-mail de teste que receba mensagens.

A configuração SMTP ainda não foi aplicada; não divulgar entregabilidade de e-mail como validada.

## Separação dos planos

O banco `public.lotolab_analysis_access` verifica plano, estado, datas de validade e identidade `auth.uid()`. Nenhuma conta recém-criada ganha automaticamente Essencial ou Avançado.

## Testes técnicos

`npm test` para regras puras e fragmentos de redirecionamento; `npm run test:e2e` para a jornada de recuperação com respostas HTTP controladas em testes. Para homologação real, repetir contra SMTP e Supabase Auth configurados.

## Serviço comercial de análises

A cobrança recorrente, confirmação de pagamento e concessão de direitos por provedor externo **não estão habilitadas**. A senha nunca deve ser transmitida por e-mail nem persistida em tabelas próprias.
