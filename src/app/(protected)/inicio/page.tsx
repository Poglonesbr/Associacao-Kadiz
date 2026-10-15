import { FileText, Users, Wallet, TriangleAlert, ClipboardCheck, CalendarCheck } from "lucide-react";
import { LinkButton, PageHeader, Panel } from "@/components/ui";
import { requirePermission } from "@/lib/guards";
import { formatBrazilianCurrency } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requirePermission("dashboard");
  const [
    activeStudents,
    socialStudents,
    privateStudents,
    pendingDocuments,
    pendingInvoices,
    overdueInvoices,
    psychologyAppointments,
    socialAppointments,
    overdueReviews,
    polos,
  ] =
    await Promise.all([
      prisma.aluno.count({ where: { status: "ATIVO" } }),
      prisma.aluno.count({ where: { status: "ATIVO", vinculo: "PROJETO_SOCIAL" } }),
      prisma.aluno.count({ where: { status: "ATIVO", vinculo: "PARTICULAR" } }),
      prisma.studentDocument.count({ where: { status: "PENDENTE" } }),
      prisma.invoice.count({ where: { status: "PENDENTE" } }),
      prisma.invoice.aggregate({
        where: { status: "PENDENTE", dueDate: { lt: new Date(Date.now() - 10 * 86400000) } },
        _sum: { amount: true },
      }),
      prisma.atendimento.count({ where: { area: "PSICOLOGIA", date: { gte: new Date(new Date().getFullYear(), 0, 1) } } }),
      prisma.atendimento.count({ where: { area: "SERVICO_SOCIAL", date: { gte: new Date(new Date().getFullYear(), 0, 1) } } }),
      prisma.atendido.count({ where: { status: "ATIVO", nextReviewDate: { lt: new Date() } } }),
      prisma.polo.findMany({
        where: { active: true },
        include: { _count: { select: { alunos: { where: { status: "ATIVO" } } } } },
        orderBy: { name: "asc" },
      }),
    ]);
  const cards = [
    {
      icon: Users,
      label: "Alunos ativos",
      number: activeStudents.toString(),
      detail: `${socialStudents} projeto social · ${privateStudents} particulares`,
    },
    {
      icon: FileText,
      label: "Documentos pendentes",
      number: pendingDocuments.toString(),
      detail: "Aguardando entrega ou conferência",
    },
    {
      icon: Wallet,
      label: "Faturas pendentes",
      number: pendingInvoices.toString(),
      detail: `${formatBrazilianCurrency(overdueInvoices._sum.amount ?? 0)} em atraso`,
    },
  ];
  return (
    <>
      <PageHeader eyebrow="Painel de gestão" title="Início" />
      <div className="mb-6 flex flex-wrap gap-2">
        {can(user, "students:write") && <LinkButton href="/alunos/novo">+ Novo aluno</LinkButton>}
        <LinkButton href="/chamada" variant="secondary">
          <CalendarCheck size={16} />
          Registrar chamada
        </LinkButton>
        <LinkButton href="/documentos?status=PENDENTE" variant="secondary">
          <FileText size={16} />
          Documentos pendentes
        </LinkButton>
        <LinkButton href="/tarefas" variant="secondary">
          <ClipboardCheck size={16} />
          Ver tarefas
        </LinkButton>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(({ icon: Icon, label, number, detail }) => (
          <Panel key={label} className="p-5">
            <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800">
              <Icon size={18} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-semibold">{number}</p>
            <p className="mt-2 font-medium">{label}</p>
            <p className="mt-1 text-sm text-neutral-500">{detail}</p>
          </Panel>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="font-semibold">Visão por polo</h2>
          <p className="mb-5 mt-1 text-sm text-neutral-500">Alunos matriculados por unidade</p>
          <div className="space-y-4">
            {polos.map((polo) => (
              <div key={polo.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{polo.name}</span>
                  <span className="text-neutral-400">{polo._count.alunos}</span>
                </div>
                <div className="h-1.5 rounded bg-neutral-800">
                  <div
                    className="h-full rounded bg-emerald-500"
                    style={{ width: `${Math.min(100, polo._count.alunos * 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <TriangleAlert className="text-amber-400" size={18} />
            <h2 className="font-semibold">Metas do Projeto FIA 2026</h2>
          </div>
          <div className="mt-6 space-y-5">
            {[
              ["Crianças atendidas", socialStudents, 130],
              ["Atendimentos psicológicos/ano", psychologyAppointments, 960],
              ["Atendimentos sociais/ano", socialAppointments, 390],
              ["Reavaliações atrasadas", overdueReviews, 0],
            ].map(([label, value, goal]) => (
              <div key={String(label)}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <span>
                    {goal ? `${value} / ${goal}` : `${value} atrasadas`}
                  </span>
                </div>
                <div className="h-2 rounded bg-neutral-800">
                  <div
                    className="h-full rounded bg-emerald-500"
                    style={{ width: `${goal ? Math.min(100, (Number(value) / Number(goal)) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
