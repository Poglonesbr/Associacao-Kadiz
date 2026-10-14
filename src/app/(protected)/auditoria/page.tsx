import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader, Panel, DataTable } from "@/components/ui";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export default async function AuditPage() {
  await requirePermission("audit");
  const logs = await prisma.accessLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return <><PageHeader eyebrow="Segurança e conformidade" title="Auditoria" /><Panel><DataTable headers={["Data e hora", "Usuário", "Ação", "Recurso", "Registro"]} count={logs.length}>{logs.map((log) => <tr key={log.id}><td className="px-4 py-3">{format(log.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}</td><td className="px-4 py-3">{log.user.name}</td><td className="px-4 py-3">{log.action}</td><td className="px-4 py-3">{log.resource}</td><td className="px-4 py-3 text-neutral-500">{log.resourceId ?? log.alunoId ?? "—"}</td></tr>)}</DataTable></Panel></>;
}
