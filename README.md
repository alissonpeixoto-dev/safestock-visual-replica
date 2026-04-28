# SafeStock — Gestão de Projetos e Sprints

Aplicação web para organização de projetos, backlog e sprints, com autenticação por e-mail/senha e dados isolados por usuário.

## ✨ Funcionalidades

- Cadastro, login e recuperação de senha (Supabase Auth)
- Toggle de visibilidade de senha mantendo valor e posição do cursor
- Dashboard de projetos por usuário (cada conta vê apenas seus próprios dados)
- Gestão de sprints, backlog e cartões por projeto
- Interface responsiva com Tailwind CSS + shadcn/ui

## 🛠️ Tecnologias

- **Vite 5** + **React 18** + **TypeScript**
- **Tailwind CSS 3** + **shadcn/ui** (Radix)
- **React Router DOM 6**
- **Supabase** (Auth + Database) — via Lovable Cloud
- **TanStack Query**, **Sonner**, **Lucide Icons**

## 🚀 Rodando localmente (VS Code)

Pré-requisitos: **Node.js 18+** e **npm**.

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env
# edite o arquivo .env com suas credenciais do Supabase

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação ficará disponível em `http://localhost:8080`.

### Outros scripts

```bash
npm run build      # build de produção (gera /dist)
npm run preview    # serve o build localmente
npm run lint       # roda ESLint
npm test           # roda os testes (Vitest)
```

## 🔐 Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon) do Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto Supabase |

> Todas as variáveis são públicas (`VITE_*`) — são embutidas no bundle do cliente. Use apenas a chave **anon/publishable**, nunca a `service_role`.

## ☁️ Deploy na Vercel

1. Faça push do projeto em um repositório Git (GitHub/GitLab/Bitbucket).
2. Em [vercel.com](https://vercel.com) clique em **Add New → Project** e importe o repositório.
3. A Vercel detectará automaticamente o framework **Vite**. Confirme:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
5. Clique em **Deploy**.

O arquivo `vercel.json` já está configurado com o rewrite para SPA (todas as rotas caem em `index.html`), garantindo que o React Router funcione em refresh e deep links.

## 📁 Estrutura

```
src/
 ├─ components/        # Componentes reutilizáveis (UI, Header)
 ├─ hooks/             # Hooks customizados
 ├─ integrations/      # Cliente Supabase (auto-gerado)
 ├─ lib/               # Utilitários e session helpers
 ├─ pages/             # Rotas (Auth, Dashboard, Sprints, etc.)
 └─ index.css          # Tokens de design (Tailwind)
```

## 📝 Licença

Projeto acadêmico — uso livre para fins educacionais.
