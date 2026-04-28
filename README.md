# VIP Sistema

Projeto independente do sistema autenticado da VIP Manuseios.

## O que tem aqui

- login
- reset de senha
- portal do cliente
- área administrativa
- integração com Supabase
- migrations e edge functions em `supabase/`

## Variáveis de ambiente

Crie um `.env` com:

```env
VITE_SUPABASE_PROJECT_ID=seu_project_id
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_publishable_key
LOVABLE_API_KEY=sua_chave_se_precisar_das_funcoes
```

## Comandos

```bash
npm install --legacy-peer-deps
npm run dev
npm run build
```

## Rotas principais

- `/login`
- `/reset-password`
- `/app/*`
- `/portal/*`

## Observação

Este projeto foi separado da landing pública. A rota `/` redireciona para `/login`.
