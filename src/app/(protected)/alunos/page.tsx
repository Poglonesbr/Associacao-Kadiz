import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader, DataTable, StatusBadge, LinkButton, EmptyState } from "@/components/ui";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getCategory } from "@/lib/category";
import { setStudentStatus } from "@/app/actions";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function StudentsPage({ searchParams }: { searchParams: { q?: string; polo?: string; vinculo?: string; status?: string } }) {
  const user = await requirePermission("students:view");
  const [students, polos] = await Promise.all([
    prisma.aluno.findMany({
      where: {
        ...(searchParams.q ? { fullName: { contains: searchParams.q, mode: "insensitive" } } : {}),
        ...(searchParams.polo ? { poloId: searchParams.polo } : {}),
        ...(searchParams.vinculo ? { vinculo: searchParams.vinculo as "PARTICULAR" | "PROJETO_SOCIAL" } : {}),
        ...(searchParams.status ? { status: searchParams.status as "ATIVO" | "INATIVO" | "LISTA_ESPERA" | "DESLIGADO" } : {}),
      },
      include: { polo: true, turma: true }, orderBy: { fullName: "asc" }, take: 100,
    }),
    prisma.polo.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  return <><PageHeader eyebrow="Gestão de matrículas" title="Alunos" action={can(user, "students:write") ? <LinkButton href="/alunos/novo">+ Novo aluno</LinkButton> : undefined} />
    <form className="mb-4 grid gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4 md:grid-cols-5">
      <input name="q" defaultValue={searchParams.q} placeholder="Buscar aluno..." className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
      <select name="polo" defaultValue={searchParams.polo ?? ""} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"><option value="">Todos os polos</option>{polos.map((polo) => <option key={polo.id} value={polo.id}>{polo.name}</option>)}</select>
      <select name="vinculo" defaultValue={searchParams.vinculo ?? ""} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"><option value="">Todos os vínculos</option><option value="PROJETO_SOCIAL">Projeto Social</option><option value="PARTICULAR">Particular</option></select>
      <select name="status" defaultValue={searchParams.status ?? ""} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"><option value="">Todos os status</option><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option><option value="LISTA_ESPERA">Lista de espera</option><option value="DESLIGADO">Desligado</option></select>
      <button className="rounded-lg bg-neutral-800 px-3 py-2 text-sm">Filtrar</button>
    </form>
    <DataTable headers={["Aluno", "Polo / Turma", "Categoria", "Nascimento", "Status", "Matrícula", "Ações"]} count={students.length}>
      {students.length ? students.map((student) => <tr key={student.id} className="text-sm"><td className="px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-xs">{student.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("")}</span><div><Link className="font-medium text-white hover:text-emerald-400" href={`/alunos/${student.id}`}>{student.fullName}</Link><p className="text-xs text-neutral-500">{student.matricula} · {student.vinculo === "PROJETO_SOCIAL" ? "Projeto Social" : "Particular"}</p></div></div></td><td className="px-4 py-3 text-neutral-300">{student.polo.name}<p className="text-xs text-neutral-500">{student.turma?.name ?? "Sem turma"}</p></td><td className="px-4 py-3 text-neutral-400">{getCategory(student.birthDate)}</td><td className="px-4 py-3 text-neutral-300">{format(student.birthDate, "dd/MM/yyyy", { locale: ptBR })}<p className="text-xs text-neutral-500">{new Date().getFullYear() - student.birthDate.getFullYear()} anos</p></td><td className="px-4 py-3"><StatusBadge tone={student.status === "ATIVO" ? "green" : "neutral"}>{student.status === "ATIVO" ? "Ativo" : student.status === "LISTA_ESPERA" ? "Lista de espera" : student.status === "DESLIGADO" ? "Desligado" : "Inativo"}</StatusBadge></td><td className="px-4 py-3 text-neutral-400">{format(student.enrolledAt, "dd MMM yyyy", { locale: ptBR })}</td><td className="px-4 py-3"><div className="flex gap-3"><Link href={`/alunos/${student.id}`} className="text-emerald-400">Ver</Link>{can(user, "students:write") && student.status !== "DESLIGADO" && <form action={setStudentStatus}><input type="hidden" name="id" value={student.id} /><input type="hidden" name="status" value="DESLIGADO" /><input type="hidden" name="reason" value="Desligamento solicitado pela equipe" /><button className="text-neutral-500" title="Desligar">Desligar</button></form>}</div></td></tr>) : <tr><td colSpan={7}><EmptyState text="Nenhum aluno encontrado." /></td></tr>}
    </DataTable>
  </>;
}
