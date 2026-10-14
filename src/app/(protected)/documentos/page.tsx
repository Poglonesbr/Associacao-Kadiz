import Link from "next/link";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader, DataTable, StatusBadge, EmptyState } from "@/components/ui";
import { updateDocument } from "@/app/actions";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export default async function DocumentsPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  await requirePermission("documents");
  const documents = await prisma.studentDocument.findMany({
    where: {
      ...(searchParams.status ? { status: searchParams.status as "PENDENTE" | "ENTREGUE" | "APROVADO" | "REJEITADO" } : {}),
      ...(searchParams.q ? { aluno: { fullName: { contains: searchParams.q, mode: "insensitive" } } } : {}),
    },
    include: { aluno: true }, orderBy: { aluno: { fullName: "asc" } }, take: 100,
  });
  return <><PageHeader eyebrow="Central documental" title="Documentos dos Alunos" /><form className="mb-4 flex gap-3"><input name="q" defaultValue={searchParams.q} placeholder="Buscar por documento ou aluno..." className="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" /><select name="status" defaultValue={searchParams.status ?? ""} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"><option value="">Todos os status</option><option value="PENDENTE">Pendente</option><option value="ENTREGUE">Entregue</option><option value="APROVADO">Aprovado</option><option value="REJEITADO">Rejeitado</option></select><button className="rounded-lg bg-neutral-800 px-4 text-sm">Filtrar</button></form>
  <DataTable headers={["Aluno", "Documento", "Arquivo", "Status / prazo", "Ações"]} count={documents.length}>{documents.length ? documents.map((document) => { const due = addDays(document.aluno.enrolledAt, 15); const overdue = document.status === "PENDENTE" && due < new Date(); return <tr key={document.id}><td className="px-4 py-3"><p className="font-medium">{document.aluno.fullName}</p><p className="text-xs text-neutral-500">{document.aluno.matricula}</p></td><td className="px-4 py-3 text-neutral-300">{document.type.replaceAll("_", " ")}</td><td className="px-4 py-3 text-neutral-400">{document.filePath ? <Link className="text-emerald-400 hover:underline" href={`/api/documentos/${document.id}/download`}>{document.fileName}</Link> : "Aguardando envio"}</td><td className="px-4 py-3"><StatusBadge tone={overdue ? "red" : document.status === "APROVADO" ? "green" : document.status === "PENDENTE" ? "amber" : "neutral"}>{overdue ? "Atrasado" : document.status}</StatusBadge><p className="mt-1 text-xs text-neutral-500">Prazo: {format(due, "dd/MM/yyyy", { locale: ptBR })}</p></td><td className="px-4 py-3"><div className="flex flex-col gap-2"><form action="/api/documentos/upload" method="post" encType="multipart/form-data" className="flex gap-1"><input type="hidden" name="documentId" value={document.id} /><input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-40 text-xs" /><button className="text-xs text-emerald-400">Enviar</button></form><div className="flex gap-2"><form action={updateDocument}><input type="hidden" name="id" value={document.id} /><input type="hidden" name="status" value="APROVADO" /><button className="text-xs text-emerald-400">Aprovar</button></form><form action={updateDocument}><input type="hidden" name="id" value={document.id} /><input type="hidden" name="status" value="REJEITADO" /><button className="text-xs text-red-400">Rejeitar</button></form></div></div></td></tr>; }) : <tr><td colSpan={5}><EmptyState text="Nenhum documento encontrado." /></td></tr>}</DataTable></>;
}
