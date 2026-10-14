# Associação Kadiz — Sistema de Gestão

Aplicação interna para gestão da Associação Kadiz. Acesso exclusivo à equipe e hospedagem própria com Docker e PostgreSQL; não há contas para responsáveis ou alunos.

## Requisitos

- Node.js 20 e npm 10 para desenvolvimento local
- PostgreSQL 16
- Docker Engine e Docker Compose v2 para execução em servidor

## Desenvolvimento local

1. Instale as dependências e crie a configuração local:

   ```sh
   npm ci
   cp .env.example .env
   ```

2. Ajuste `DATABASE_URL` para apontar para um PostgreSQL 16 local. Inicie o banco e crie a base `kadiz`.
3. Gere o cliente Prisma, aplique as migrações e (opcionalmente) carregue dados fictícios:

   ```sh
   npx prisma generate
   npm run db:migrate
   SEED_DEMO=true npm run db:seed
   ```

   O seed cria as sete contas iniciais apenas quando ainda não existem e preserva senhas já alteradas. Registros fictícios de demonstração só são criados com `SEED_DEMO=true`.

4. Inicie a aplicação:

   ```sh
   npm run dev
   ```

   Acesse <http://localhost:3000>. O usuário inicial é `admin@kadiz.com`, senha `kadiz123`. Altere as senhas iniciais antes de disponibilizar o sistema.

## Scripts

| Comando              | Descrição                                            |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Servidor de desenvolvimento                          |
| `npm run build`      | Build de produção                                    |
| `npm run start`      | Servidor Next.js de produção                         |
| `npm run lint`       | ESLint                                               |
| `npm run typecheck`  | TypeScript sem emissão                               |
| `npm test`           | Testes unitários Vitest                              |
| `npm run db:migrate` | Aplica migrações pendentes                           |
| `npm run db:seed`    | Cria as contas iniciais e, se habilitado, dados demo |

## Deploy em VPS com Docker Compose

1. Instale Docker Engine e o plugin Docker Compose v2 na VPS.
2. Clone o repositório e prepare as variáveis:

   ```sh
   cp .env.example .env
   ```

3. Edite `.env`: defina um `NEXTAUTH_SECRET` aleatório e forte, senha exclusiva do PostgreSQL (`POSTGRES_PASSWORD`) e ajuste `NEXTAUTH_URL` para a URL pública servida pelo seu proxy HTTPS. Configure também `POSTGRES_USER` e `POSTGRES_DB` se necessário. Não publique a porta 3000 diretamente na Internet; use um proxy reverso TLS e firewall.
4. Construa e inicie:

   ```sh
   docker compose up -d --build
   docker compose logs -f app
   ```

   O serviço da aplicação aguarda a saúde do PostgreSQL, aplica migrações, cria contas de equipe ausentes e inicia o Next.js. `SEED_DEMO=true` pode ser usado para carregar dados fictícios na primeira implantação.

5. Os dados do PostgreSQL ficam no volume `postgres_data`; documentos enviados ficam em `./uploads`. Inclua ambos na política de backup. Não remova volumes ao atualizar o sistema.

## Segurança e dados

- A autenticação é exclusiva para funcionários; permissões são aplicadas no servidor.
- Registros psicológicos e do serviço social exigem perfil profissional ou autorização explícita.
- Documentos ficam em armazenamento local protegido e são servidos apenas por uma rota autenticada.
- Use dados fictícios nas demonstrações. Proteja as fichas reais conforme a LGPD e as políticas internas da Associação.
