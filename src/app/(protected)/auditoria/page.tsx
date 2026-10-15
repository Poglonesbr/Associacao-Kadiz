import { AccessAction } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader, Panel, DataTable } from "@/components/ui";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/query-pagination";

export const dynamic = "force-dynamic";
type SearchParams = { page?: string; pageSize?: string; action?: string; resource?: string };
export default async function AuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  await requirePermission("audit");
  const { page, pageSize, skip } = getPagination(params.page, params.pageSize);
  const action = Object.values(AccessAction).find((value) => value === params.action);
  const where = {
    ...(action ? { action } : {}),
    ...(params.resource ? { resource: { contains: params.resource, mode: "insensitive" as const } } : {}),
  };
  const [logs, total] = await Promise.all([
    prisma.accessLog.findMany({
      where,
      select: { id: true, action: true, resource: true, resourceId: true, alunoId: true, createdAt: true, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.accessLog.count({ where }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Segurança e conformidade" title="Auditoria" />
      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input name="resource" defaultValue={params.resource} placeholder="Filtrar recurso" className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
        <select name="action" defaultValue={params.action ?? ""} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
          <option value="">Todas as ações</option>
          <option value="VIEW">Visualização</option>
          <option value="CREATE">Criação</option>
          <option value="UPDATE">Atualização</option>
          <option value="GRANT">Concessão</option>
          <option value="REVOKE">Revogação</option>
        </select>
        <button className="rounded-lg bg-neutral-800 px-3 py-2 text-sm">Filtrar</button>
      </form>
      <Panel>
        <DataTable headers={["Data e hora", "Usuário", "Ação", "Recurso", "Registro"]} count={total} page={page} pageSize={pageSize}>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3">{format(log.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
              <td className="px-4 py-3">{log.user.name}</td>
              <td className="px-4 py-3">{log.action}</td>
              <td className="px-4 py-3">{log.resource}</td>
              <td className="px-4 py-3 text-neutral-500">{log.resourceId ?? log.alunoId ?? "—"}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </>
  );
}
