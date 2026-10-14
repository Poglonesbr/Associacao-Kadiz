import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Search } from "lucide-react";
import { AutoFilterForm } from "@/components/auto-filter-form";
import { StudentRowActions } from "@/components/student-row-actions";
import { DataTable, EmptyState, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { getAge, getCategory } from "@/lib/category";
import { requirePermission } from "@/lib/guards";
import { labelFor } from "@/lib/labels";
import { getPagination } from "@/lib/query-pagination";
import { prisma } from "@/lib/prisma";
import { buildStudentWhere } from "@/lib/student-query";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  polo?: string;
  turma?: string;
  vinculo?: string;
  status?: string;
  categoria?: string;
  page?: string;
  pageSize?: string;
};

export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePermission("students:view");
  const { page, pageSize, skip } = getPagination(searchParams.page, searchParams.pageSize);
  const where = buildStudentWhere(searchParams);
  const [students, total, polos, turmas] = await Promise.all([
    prisma.aluno.findMany({
      where,
      include: { polo: true, turma: true },
      orderBy: { fullName: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.aluno.count({ where }),
    prisma.polo.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.turma.findMany({
      where: { active: true },
      include: { polo: true },
      orderBy: [{ polo: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  const exportParams = new URLSearchParams();
  for (const key of ["q", "polo", "turma", "vinculo", "status", "categoria"] as const) {
    const value = searchParams[key];
    if (value) exportParams.set(key, value);
  }
  const exportHref = `/api/alunos${exportParams.size ? `?${exportParams}` : ""}`;
  const categories = Array.from({ length: 9 }, (_, index) => `Sub-${index * 2 + 4}`);

  return (
    <>
      <PageHeader
        eyebrow="Gestão de matrículas"
        title="Alunos"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={exportHref}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3.5 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
            >
              <Download size={16} />
              Exportar CSV
            </Link>
            {can(user, "students:write") && <LinkButton href="/alunos/novo">+ Novo aluno</LinkButton>}
          </div>
        }
      />

      <AutoFilterForm className="mb-4 grid gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4 md:grid-cols-3 xl:grid-cols-6">
        <label className="relative block">
          <span className="sr-only">Buscar aluno</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Buscar aluno..."
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 py-2 pl-9 pr-3 text-sm"
          />
        </label>
        <select
          name="polo"
          defaultValue={searchParams.polo ?? ""}
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
        >
          <option value="">Todos os polos</option>
          {polos.map((polo) => (
            <option key={polo.id} value={polo.id}>
              {polo.name}
            </option>
          ))}
        </select>
        <select
          name="turma"
          defaultValue={searchParams.turma ?? ""}
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
        >
          <option value="">Todas as turmas</option>
          {turmas.map((turma) => (
            <option key={turma.id} value={turma.id}>
              {turma.polo.name} · {turma.name}
            </option>
          ))}
        </select>
        <select
          name="categoria"
          defaultValue={searchParams.categoria ?? ""}
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
        >
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          name="vinculo"
          defaultValue={searchParams.vinculo ?? ""}
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
        >
          <option value="">Todos os vínculos</option>
          <option value="PROJETO_SOCIAL">Projeto Social</option>
          <option value="PARTICULAR">Particular</option>
        </select>
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="INATIVO">Inativo</option>
          <option value="LISTA_ESPERA">Lista de espera</option>
          <option value="DESLIGADO">Desligado</option>
        </select>
        <button type="submit" className="sr-only">
          Aplicar busca
        </button>
      </AutoFilterForm>

      <DataTable
        headers={["Aluno", "Polo / Turma", "Categoria", "Nascimento", "Status", "Matrícula", "Ações"]}
        count={total}
        page={page}
        pageSize={pageSize}
      >
        {students.length ? (
          students.map((student) => (
            <tr key={student.id} className="text-sm">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-xs">
                    {student.fullName
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <div>
                    <Link className="font-medium text-white hover:text-emerald-400" href={`/alunos/${student.id}`}>
                      {student.fullName}
                    </Link>
                    <p className="text-xs text-neutral-500">
                      {student.matricula} · {student.vinculo === "PROJETO_SOCIAL" ? "Projeto Social" : "Particular"}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-neutral-300">
                {student.polo.name}
                <p className="text-xs text-neutral-500">{student.turma?.name ?? "Sem turma"}</p>
              </td>
              <td className="px-4 py-3 text-neutral-400">{getCategory(student.birthDate)}</td>
              <td className="px-4 py-3 text-neutral-300">
                {format(student.birthDate, "dd/MM/yyyy", { locale: ptBR })}
                <p className="text-xs text-neutral-500">{getAge(student.birthDate)} anos</p>
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  tone={student.status === "ATIVO" ? "green" : student.status === "DESLIGADO" ? "red" : "neutral"}
                >
                  {labelFor(student.status)}
                </StatusBadge>
              </td>
              <td className="px-4 py-3 text-neutral-400">
                {format(student.enrolledAt, "dd MMM yyyy", { locale: ptBR })}
              </td>
              <td className="px-4 py-3">
                <StudentRowActions
                  studentId={student.id}
                  status={student.status}
                  canWrite={can(user, "students:write")}
                />
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={7}>
              <EmptyState text="Nenhum aluno encontrado." />
            </td>
          </tr>
        )}
      </DataTable>
    </>
  );
}
