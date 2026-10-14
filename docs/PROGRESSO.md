# Progresso do desenvolvimento — Sistema Kadiz

Última atualização: 14/10/2026. Branch: `devin/1791986830-sistema-kadiz`.

## Decisões já tomadas
- Hospedagem própria (Docker Compose + PostgreSQL 16). Sem Vercel.
- Fora do escopo por enquanto: acesso de pais/alunos, chat de texto, câmeras.
- Stack: Next.js 15.5 (App Router) + React 19 + TypeScript + Tailwind + Prisma 6 + NextAuth v4 (e-mail/senha).
- **Aluno** (Particular e Projeto Social) = cadastro da secretaria, só com os campos das fichas.
- **Atendido** = registro extra 1:1, só para aluno do Projeto Social; criado/editado só pela equipe técnica
  (Psicologia / Serviço Social). Identificação vem do cadastro do aluno (somente leitura).
- PIA, dados socioeconômicos, encaminhamentos e histórico: compartilhados entre as duas áreas técnicas.
  Atendimentos e evoluções: visíveis só para a própria área. Admin/Coordenação veem apenas números agregados no painel.
- Todo acesso/alteração em dado sigiloso gera registro em `AccessLog` (Auditoria).

## Pronto
- Login, perfis, permissões técnicas por usuário (chaves Psicologia/Serviço Social), página 403, auditoria.
- Usuários (cargo e registro profissional CRP/CRESS), Polos e Turmas (Sede + 6 polos).
- Alunos: lista com filtros, paginação e exportação CSV; cadastro em etapas pelas fichas; ficha com abas e edição.
- Documentos (checklist, upload/download, aprovação), Chamada (registro e alerta de 3 faltas).
- Serviço Social e Psicologia: Painel (metas FIA), Atendidos, Atendimentos, Evoluções, Encaminhamentos, Equipe técnica.
- Ficha do Atendido / PIA em 8 seções, assinatura na tela, reavaliações, encerramento, histórico de alterações, PDF do PIA.
- Datas no formato dd/mm/aaaa, valores em R$ (pt-BR), dados de demonstração (`SEED_DEMO=true npm run db:seed`).
- Verificado: lint, typecheck, 39 testes, build; `npm audit --omit=dev` sem vulnerabilidades.

## Pendente (próximos passos)
1. Testar manualmente a assinatura na tela (canvas) — não foi validada no teste automatizado.
2. Repetir o teste de acesso com Psicologia (só vê a própria área) e Secretaria (403 no Atendido) após o upgrade para Next 15.
3. Fase 3: Estoque (uniformes por tamanho e doações; entrega só com documentação completa), Financeiro
   (mensalidades, faturas, inadimplência > 10 dias, despesas), Agenda, Tarefas, Lanche e Painel inicial com metas FIA.
   Hoje essas abas mostram "em construção".
4. Testar a instalação com Docker Compose num servidor (na máquina de desenvolvimento o Docker não funcionou).
5. Definir a VPS/servidor e o domínio para publicação.

## Como rodar localmente
Ver `README.md` (seção de hospedagem própria). Usuários de demonstração: `admin@kadiz.com`, `secretaria@kadiz.com`,
`psicologia@kadiz.com`, `social@kadiz.com`, `professor@kadiz.com`, `financeiro@kadiz.com`, `coordenacao@kadiz.com`
— senha inicial `kadiz123` (trocar antes de publicar).
