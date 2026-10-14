import Link from "next/link";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search } from "lucide-react";
import { AutoFilterForm } from "@/components/auto-filter-form";
import { DataTable, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { updateDocument } from "@/app/actions/documentos";
import { requirePermission } from "@/lib/guards";
import { getPagination } from "@/lib/query-pagination";
import { labelFor } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string; status?: string; page?: string; pageSize?: string };

export default async function DocumentsPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePermission("documents");
  const { page, pageSize, skip } = getPagination(searchParams.page, searchParams.pageSize);
  const status = ["PENDENTE", "ENTREGUE", "APROVADO", "REJEITADO"].includes(searchParams.status ?? "")
    ? (searchParams.status as "PENDENTE" | "ENTREGUE" | "APROVADO" | "REJEITADO")
    : undefined;
  const where = {
    ...(status ? { status } : {}),
    ...(searchParams.q?.trim()
      ? { aluno: { fullName: { contains: searchParams.q.trim(), mode: "insensitive" as const } } }
      : {}),
  };
  const [documents, total] = await Promise.all([
    prisma.studentDocument.findMany({
      where,
      include: { aluno: true },
      orderBy: [{ aluno: { fullName: "asc" } }, { type: "asc" }],
      skip,
      take: pageSize,
    }),
    prisma.studentDocument.count({ where }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Central documental" title="Documentos dos Alunos" />
      <AutoFilterForm className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative block w-full max-w-md">
          <span className="sr-only">Buscar por aluno</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Buscar por aluno..."
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 py-2 pl-9 pr-3 text-sm"
          />
        </label>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="ENTREGUE">Entregue</option>
          <option value="APROVADO">Aprovado</option>
          <option value="REJEITADO">Rejeitado</option>
        </select>
        <button type="submit" className="sr-only">
          Aplicar busca
        </button>
      </AutoFilterForm>

      <DataTable
        headers={["Aluno", "Documento", "Arquivo", "Status / prazo", "Ações"]}
        count={total}
        page={page}
        pageSize={pageSize}
      >
        {documents.length ? (
          documents.map((document) => {
            const due = addDays(document.aluno.enrolledAt, 15);
            const overdue = document.status === "PENDENTE" && due < new Date();
            return (
              <tr key={document.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{document.aluno.fullName}</p>
                  <p className="text-xs text-neutral-500">{document.aluno.matricula}</p>
                </td>
                <td className="px-4 py-3 text-neutral-300">{labelFor(document.type)}</td>
                <td className="px-4 py-3 text-neutral-400">
                  {document.filePath ? (
                    <Link className="text-emerald-400 hover:underline" href={`/api/documentos/${document.id}/download`}>
                      {document.fileName}
                    </Link>
                  ) : (
                    "Aguardando envio"
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    tone={
                      overdue
                        ? "red"
                        : document.status === "APROVADO"
                          ? "green"
                          : document.status === "PENDENTE"
                            ? "amber"
                            : "neutral"
                    }
                  >
                    {overdue ? "Atrasado" : labelFor(document.status)}
                  </StatusBadge>
                  <p className="mt-1 text-xs text-neutral-500">Prazo: {format(due, "dd/MM/yyyy", { locale: ptBR })}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <form
                      action="/api/documentos/upload"
                      method="post"
                      encType="multipart/form-data"
                      className="flex gap-1"
                    >
                      <input type="hidden" name="documentId" value={document.id} />
                      <input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-40 text-xs" />
                      <button className="text-xs text-emerald-400">Enviar</button>
                    </form>
                    <div className="flex gap-2">
                      <form action={updateDocument}>
                        <input type="hidden" name="id" value={document.id} />
                        <input type="hidden" name="status" value="APROVADO" />
                        <button className="text-xs text-emerald-400">Aprovar</button>
                      </form>
                      <form action={updateDocument}>
                        <input type="hidden" name="id" value={document.id} />
                        <input type="hidden" name="status" value="REJEITADO" />
                        <button className="text-xs text-red-400">Rejeitar</button>
                      </form>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={5}>
              <EmptyState text="Nenhum documento encontrado." />
            </td>
          </tr>
        )}
      </DataTable>
    </>
  );
}
