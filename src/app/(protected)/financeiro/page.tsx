import { FinanceType } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createFinanceEntry, createInvoice, updateInvoiceStatus } from "@/app/actions/financeiro";
import { Button, DataTable, EmptyState, Field, PageHeader, Panel, SelectField, StatusBadge } from "@/components/ui";
import { requirePermission } from "@/lib/guards";
import { formatBrazilianCurrency } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  await requirePermission("finance");
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const [students, invoices, entries, income, expenses, pending, overdue] = await Promise.all([
    prisma.aluno.findMany({ where: { status: "ATIVO" }, select: { id: true, fullName: true, matricula: true }, orderBy: { fullName: "asc" } }),
    prisma.invoice.findMany({ include: { aluno: { select: { fullName: true, matricula: true } } }, orderBy: { dueDate: "asc" }, take: 100 }),
    prisma.financeEntry.findMany({ orderBy: { date: "desc" }, take: 50 }),
    prisma.financeEntry.aggregate({ where: { type: "RECEITA", date: { gte: monthStart, lt: nextMonth } }, _sum: { amount: true } }),
    prisma.financeEntry.aggregate({ where: { type: "DESPESA", date: { gte: monthStart, lt: nextMonth } }, _sum: { amount: true } }),
    prisma.invoice.aggregate({ where: { status: "PENDENTE" }, _sum: { amount: true }, _count: true }),
    prisma.invoice.aggregate({ where: { status: "PENDENTE", dueDate: { lt: new Date() } }, _sum: { amount: true }, _count: true }),
  ]);
  const cards = [
    ["Receitas no mês", income._sum.amount, "green"],
    ["Despesas no mês", expenses._sum.amount, "red"],
    ["Faturas pendentes", pending._sum.amount, "amber"],
    ["Em atraso", overdue._sum.amount, "red"],
  ] as const;
  return (
    <>
      <PageHeader eyebrow="Gestão financeira" title="Financeiro" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, amount, tone]) => <Panel key={label} className="p-5"><p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p><p className={`mt-2 text-2xl font-semibold ${tone === "green" ? "text-emerald-300" : tone === "red" ? "text-red-300" : "text-amber-300"}`}>{formatBrazilianCurrency(amount)}</p>{label === "Faturas pendentes" && <p className="mt-1 text-xs text-neutral-500">{pending._count} faturas</p>}{label === "Em atraso" && <p className="mt-1 text-xs text-neutral-500">{overdue._count} faturas</p>}</Panel>)}
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <Panel className="p-5"><h2 className="mb-4 text-lg font-semibold">Novo lançamento</h2><form action={createFinanceEntry} className="space-y-3">
            <SelectField label="Tipo" name="type" options={Object.values(FinanceType).map((type) => [type, type === "RECEITA" ? "Receita" : "Despesa"])} />
            <Field label="Descrição" name="description" required /><Field label="Categoria" name="category" placeholder="Ex.: alimentação, aluguel" required /><Field label="Valor" name="amount" type="currency" required /><Field label="Data" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /><Field label="Origem / beneficiário" name="source" /><Button>Salvar lançamento</Button>
          </form></Panel>
          <Panel className="p-5"><h2 className="mb-4 text-lg font-semibold">Nova fatura</h2><form action={createInvoice} className="space-y-3">
            <SelectField label="Aluno" name="alunoId" options={students.map((student) => [student.id, `${student.fullName} · ${student.matricula}`])} required /><Field label="Mês de referência" name="referenceMonth" type="month" required /><Field label="Valor" name="amount" type="currency" required /><Field label="Vencimento" name="dueDate" type="date" required /><Field label="Observações" name="notes" /><Button>Emitir fatura</Button>
          </form></Panel>
        </div>
        <div className="space-y-5">
          <Panel><div className="border-b border-neutral-800 px-5 py-4"><h2 className="font-semibold">Contas a receber</h2><p className="mt-1 text-sm text-neutral-500">Vencimentos, pagamentos e atrasos.</p></div>
            <DataTable headers={["Aluno", "Referência", "Vencimento", "Valor", "Status", "Ação"]} count={invoices.length} footer={false}>{invoices.length ? invoices.map((invoice) => { const late = invoice.status === "PENDENTE" && invoice.dueDate < new Date(); return <tr key={invoice.id}><td className="px-4 py-3"><p className="font-medium">{invoice.aluno.fullName}</p><p className="text-xs text-neutral-500">{invoice.aluno.matricula}</p></td><td className="px-4 py-3">{invoice.referenceMonth}</td><td className={`px-4 py-3 ${late ? "text-red-300" : "text-neutral-300"}`}>{format(invoice.dueDate, "dd/MM/yyyy", { locale: ptBR })}</td><td className="px-4 py-3">{formatBrazilianCurrency(invoice.amount)}</td><td className="px-4 py-3"><StatusBadge tone={invoice.status === "PAGO" ? "green" : late ? "red" : "amber"}>{late ? "Em atraso" : invoice.status}</StatusBadge></td><td className="px-4 py-3">{invoice.status === "PENDENTE" && <form action={updateInvoiceStatus}><input type="hidden" name="id" value={invoice.id} /><input type="hidden" name="status" value="PAGO" /><input type="hidden" name="paymentMethod" value="PIX" /><button className="text-xs text-emerald-300">Baixar Pix</button></form>}</td></tr>; }) : <tr><td colSpan={6}><EmptyState text="Nenhuma fatura cadastrada." /></td></tr>}</DataTable>
          </Panel>
          <Panel><div className="border-b border-neutral-800 px-5 py-4"><h2 className="font-semibold">Fluxo de caixa</h2><p className="mt-1 text-sm text-neutral-500">Últimos lançamentos registrados.</p></div><DataTable headers={["Data", "Descrição", "Categoria", "Origem", "Valor"]} count={entries.length} footer={false}>{entries.length ? entries.map((entry) => <tr key={entry.id}><td className="px-4 py-3">{format(entry.date, "dd/MM/yyyy", { locale: ptBR })}</td><td className="px-4 py-3 font-medium">{entry.description}</td><td className="px-4 py-3 text-neutral-400">{entry.category}</td><td className="px-4 py-3 text-neutral-400">{entry.source ?? "—"}</td><td className={`px-4 py-3 font-semibold ${entry.type === "RECEITA" ? "text-emerald-300" : "text-red-300"}`}>{entry.type === "RECEITA" ? "+" : "-"} {formatBrazilianCurrency(entry.amount)}</td></tr>) : <tr><td colSpan={5}><EmptyState text="Nenhum lançamento cadastrado." /></td></tr>}</DataTable></Panel>
        </div>
      </div>
    </>
  );
}
