import Link from "next/link";
import { format } from "date-fns";
import { PageHeader, Panel, StatusBadge, EmptyState } from "@/components/ui";
import { AttendanceSheet } from "@/components/attendance-sheet";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { canAccessTurma } from "@/lib/permissions";
import { hasDisengagementRisk, isInvoiceOverdueForTraining } from "@/lib/rules";

export const dynamic = "force-dynamic";
export default async function AttendancePage({ searchParams }: { searchParams: { turma?: string; date?: string; tab?: string } }) {
  const user = await requirePermission("attendance");
  const now = new Date();
  const today = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date) ? searchParams.date : format(now, "yyyy-MM-dd");
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const turmas = await prisma.turma.findMany({ where: { active: true, ...(user.role === "PROFESSOR" ? { professorId: user.id } : {}) }, include: { polo: true }, orderBy: [{ polo: { name: "asc" } }, { name: "asc" }] });
  const selected = turmas.find((turma) => turma.id === searchParams.turma);
  const classId = selected?.id ?? turmas[0]?.id;
  const [students, saved, absences] = classId ? await Promise.all([
    prisma.aluno.findMany({ where: { turmaId: classId, status: "ATIVO" }, include: { invoices: { where: { status: "PENDENTE" } } }, orderBy: { fullName: "asc" } }),
    prisma.attendanceSession.findUnique({ where: { turmaId_date: { turmaId: classId, date: new Date(`${today}T12:00:00`) } }, include: { records: true } }),
    prisma.attendanceRecord.findMany({ where: { status: "FALTA", session: { turmaId: classId, date: { gte: yearStart } } }, include: { session: true } }),
  ]) : [[], null, []];
  if (selected && !canAccessTurma(user, selected.professorId)) return <p>Acesso restrito</p>;
  const absencesByStudent = new Map<string, { status: string; date: Date }[]>();
  for (const record of absences) {
    const list = absencesByStudent.get(record.alunoId) ?? [];
    list.push({ status: record.status, date: record.session.date });
    absencesByStudent.set(record.alunoId, list);
  }
  const alerts = students.filter((student) => student.vinculo === "PROJETO_SOCIAL" && hasDisengagementRisk(absencesByStudent.get(student.id) ?? [], now.getFullYear()));
  return <><PageHeader eyebrow="Controle de frequência" title="Chamada" />
    <div className="mb-5 flex gap-4 border-b border-neutral-800 text-sm"><Link className={`pb-3 ${searchParams.tab === "alerts" ? "text-neutral-400" : "border-b-2 border-emerald-400 text-white"}`} href="/chamada">Registrar presença</Link><Link className={`pb-3 ${searchParams.tab === "alerts" ? "border-b-2 border-emerald-400 text-white" : "text-neutral-400"}`} href="/chamada?tab=alerts">Alertas ({alerts.length})</Link></div>
    <form className="mb-5 grid gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4 md:grid-cols-3"><label className="text-sm text-neutral-300">Polo / Turma<select name="turma" defaultValue={classId} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2">{turmas.map((turma) => <option key={turma.id} value={turma.id}>{turma.polo.name} · {turma.name}</option>)}</select></label><label className="text-sm text-neutral-300">Data<input type="date" name="date" defaultValue={today} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2" /></label><button className="self-end rounded-lg bg-neutral-800 px-4 py-2 text-sm">Selecionar</button></form>
    {searchParams.tab === "alerts" ? <Panel className="p-5"><h2 className="mb-4 text-lg font-semibold">Alertas de frequência</h2>{alerts.length ? alerts.map((student) => <div key={student.id} className="flex justify-between border-b border-neutral-800 py-3"><span>{student.fullName}</span><StatusBadge tone="red">Risco de desligamento</StatusBadge></div>) : <EmptyState text="Nenhum alerta de faltas no momento." />}</Panel>
      : selected && students.length ? <Panel className="p-5"><div className="mb-4"><h2 className="text-lg font-semibold">{selected.name}</h2><p className="text-sm text-neutral-500">{selected.polo.name} · {today}</p></div><AttendanceSheet turmaId={classId!} date={today} students={students.map((student) => ({ id: student.id, fullName: student.fullName, matricula: student.matricula, risk: hasDisengagementRisk(absencesByStudent.get(student.id) ?? [], now.getFullYear()), blocked: student.invoices.some((invoice) => isInvoiceOverdueForTraining(invoice, now)), initialStatus: saved?.records.find((record) => record.alunoId === student.id)?.status ?? "PRESENTE" }))} /></Panel>
      : <Panel><EmptyState text="Selecione uma turma com alunos ativos para registrar a chamada." /></Panel>}
  </>;
}
