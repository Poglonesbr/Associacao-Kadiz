import { FileText, Users, Wallet, TriangleAlert } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requirePermission("dashboard");
  const [activeStudents, socialStudents, privateStudents, pendingDocuments, pendingInvoices, overdueInvoices, polos] =
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
      detail: `R$ ${Number(overdueInvoices._sum.amount ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em atraso`,
    },
  ];
  return (
    <>
      <PageHeader eyebrow="Painel de gestão" title="Início" />
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
              ["Atendimentos psicológicos/ano", 0, 960],
              ["Atendimentos sociais/ano", 0, 390],
            ].map(([label, value, goal]) => (
              <div key={String(label)}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <span>
                    {value} / {goal}
                  </span>
                </div>
                <div className="h-2 rounded bg-neutral-800">
                  <div
                    className="h-full rounded bg-emerald-500"
                    style={{ width: `${Math.min(100, (Number(value) / Number(goal)) * 100)}%` }}
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
