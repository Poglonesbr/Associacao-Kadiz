import { createStockItem, registerStockMovement } from "@/app/actions/estoque";
import { Button, Field, PageHeader, Panel, SelectField, StatusBadge } from "@/components/ui";
import { requirePermission } from "@/lib/guards";
import { labelFor } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  await requirePermission("stock");
  const [items, students, movements] = await Promise.all([
    prisma.stockItem.findMany({ orderBy: [{ quantity: "asc" }, { name: "asc" }] }),
    prisma.aluno.findMany({
      where: { status: "ATIVO" },
      select: { id: true, fullName: true, matricula: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.stockMovement.findMany({ include: { item: true, aluno: true }, orderBy: { date: "desc" }, take: 20 }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Operação" title="Estoque" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Cadastrar item</h2>
          <form action={createStockItem} className="grid gap-3 md:grid-cols-2">
            <Field label="Nome" name="name" required className="md:col-span-2" />
            <SelectField
              label="Categoria"
              name="category"
              options={[
                ["UNIFORME", "Uniforme"],
                ["DOACAO", "Doação"],
                ["MATERIAL_ESPORTIVO", "Material esportivo"],
                ["ALIMENTO", "Alimento"],
                ["OUTRO", "Outro"],
              ]}
            />
            <Field label="Tamanho" name="size" placeholder="Ex.: M" />
            <Field label="Unidade" name="unit" defaultValue="un" required />
            <Field label="Quantidade inicial" name="initialQuantity" type="number" defaultValue={0} required />
            <Field label="Estoque mínimo" name="minQuantity" type="number" defaultValue={0} required />
            <label className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-neutral-300">Observações</span>
              <textarea
                name="notes"
                rows={2}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <Button className="md:col-span-2">Cadastrar item</Button>
          </form>
        </Panel>
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Registrar movimento</h2>
          <form action={registerStockMovement} className="grid gap-3 md:grid-cols-2">
            <SelectField
              label="Item"
              name="itemId"
              required
              options={items.map(
                (item) => [item.id, `${item.name}${item.size ? ` · ${item.size}` : ""}`] as [string, string],
              )}
            />
            <SelectField
              label="Tipo"
              name="type"
              options={[
                ["ENTRADA", "Entrada"],
                ["SAIDA", "Saída"],
                ["AJUSTE", "Ajuste (saldo final)"],
              ]}
            />
            <Field label="Quantidade" name="quantity" type="number" required />
            <SelectField
              label="Aluno (opcional)"
              name="alunoId"
              options={[
                ["", "Não vincular"],
                ...students.map(
                  (student) => [student.id, `${student.fullName} · ${student.matricula}`] as [string, string],
                ),
              ]}
            />
            <Field label="Doador (para entradas)" name="donor" />
            <Field label="Motivo / observação" name="reason" />
            <Button className="md:col-span-2">Registrar movimento</Button>
          </form>
        </Panel>
      </div>
      <Panel className="mt-6 overflow-hidden">
        <div className="border-b border-neutral-800 px-5 py-4">
          <h2 className="text-lg font-semibold">Saldo dos itens</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-800 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3">Quantidade</th>
                <th className="px-5 py-3">Mínimo</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {items.map((item) => {
                const low = item.quantity <= item.minQuantity;
                return (
                  <tr key={item.id}>
                    <td className="px-5 py-3 font-medium">
                      {item.name}
                      {item.size ? ` · ${item.size}` : ""}
                      <span className="ml-2 text-xs text-neutral-500">({item.unit})</span>
                    </td>
                    <td className="px-5 py-3 text-neutral-400">{labelFor(item.category)}</td>
                    <td className="px-5 py-3">{item.quantity}</td>
                    <td className="px-5 py-3 text-neutral-400">{item.minQuantity}</td>
                    <td className="px-5 py-3">
                      <StatusBadge tone={low ? "red" : "green"}>{low ? "Estoque baixo" : "Regular"}</StatusBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!items.length && <p className="px-5 py-10 text-center text-sm text-neutral-500">Nenhum item cadastrado.</p>}
        </div>
      </Panel>
      <Panel className="mt-6 overflow-hidden">
        <div className="border-b border-neutral-800 px-5 py-4">
          <h2 className="text-lg font-semibold">Movimentos recentes</h2>
        </div>
        <div className="divide-y divide-neutral-800">
          {movements.map((movement) => (
            <div key={movement.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <div>
                <p className="font-medium">
                  {movement.item.name} ·{" "}
                  <span className={movement.type === "SAIDA" ? "text-red-300" : "text-emerald-300"}>
                    {labelFor(movement.type)}
                  </span>
                </p>
                <p className="text-xs text-neutral-500">
                  {format(movement.date, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  {movement.aluno ? ` · ${movement.aluno.fullName}` : ""}
                  {movement.donor ? ` · Doador: ${movement.donor}` : ""}
                </p>
              </div>
              <span className="font-semibold">{movement.quantity}</span>
            </div>
          ))}
          {!movements.length && (
            <p className="px-5 py-10 text-center text-sm text-neutral-500">Nenhum movimento registrado.</p>
          )}
        </div>
      </Panel>
    </>
  );
}
