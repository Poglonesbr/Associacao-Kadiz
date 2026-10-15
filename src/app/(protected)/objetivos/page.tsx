import { createObjective, updateObjective } from "@/app/actions/objectives";
import { Button, Field, PageHeader, Panel } from "@/components/ui";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ObjectivesPage() {
  await requirePermission("objectives");
  const objectives = await prisma.objective.findMany({ orderBy: [{ order: "asc" }, { title: "asc" }] });

  return (
    <>
      <PageHeader eyebrow="Planejamento" title="Objetivos e metas" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Novo objetivo</h2>
          <form action={createObjective} className="space-y-3">
            <Field label="Objetivo" name="title" required />
            <label className="block space-y-1.5 text-sm text-neutral-300">
              Descrição / resultado esperado
              <textarea
                name="description"
                rows={4}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
              />
            </label>
            <Field label="Ordem de exibição" name="order" type="number" defaultValue="0" />
            <Button>Cadastrar objetivo</Button>
          </form>
        </Panel>
        <Panel className="overflow-hidden">
          <div className="border-b border-neutral-800 px-5 py-4">
            <h2 className="font-semibold">Objetivos configurados</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Use esta aba para delimitar e organizar os objetivos usados no planejamento.
            </p>
          </div>
          <div className="divide-y divide-neutral-800">
            {objectives.map((objective) => (
              <form
                action={updateObjective}
                className="grid gap-3 p-5 md:grid-cols-[1fr_1.4fr_100px_120px_auto] md:items-end"
                key={objective.id}
              >
                <input type="hidden" name="id" value={objective.id} />
                <Field label="Objetivo" name="title" defaultValue={objective.title} required />
                <Field label="Descrição" name="description" defaultValue={objective.description ?? ""} />
                <Field label="Ordem" name="order" type="number" defaultValue={String(objective.order)} />
                <label className="space-y-1.5 text-sm text-neutral-300">
                  Status
                  <select
                    name="active"
                    defaultValue={String(objective.active)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </label>
                <button className="rounded-lg border border-neutral-700 px-3 py-2 text-sm">Salvar</button>
              </form>
            ))}
            {!objectives.length && <p className="p-5 text-sm text-neutral-500">Nenhum objetivo cadastrado.</p>}
          </div>
        </Panel>
      </div>
    </>
  );
}
