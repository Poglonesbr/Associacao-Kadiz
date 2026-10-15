import { PageHeader, Panel, Field, SelectField, Button, StatusBadge } from "@/components/ui";
import { PoloEditDialog, TurmaEditDialog } from "@/components/polo-edit-dialog";
import { createPolo, createTurma } from "@/app/actions/polos";
import { requirePermission } from "@/lib/guards";
import { labelFor } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const weekdays = [
  ["SEG", "Seg"],
  ["TER", "Ter"],
  ["QUA", "Qua"],
  ["QUI", "Qui"],
  ["SEX", "Sex"],
  ["SAB", "Sáb"],
];

export default async function PolesPage() {
  await requirePermission("poles");
  const [polos, teachers] = await Promise.all([
    prisma.polo.findMany({
      include: {
        turmas: { include: { professor: true, _count: { select: { alunos: true } } }, orderBy: { name: "asc" } },
        _count: { select: { alunos: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ where: { role: "PROFESSOR", active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Operação" title="Polos e Turmas" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Novo polo</h2>
          <form action={createPolo} className="space-y-3">
            <Field label="Nome" name="name" required />
            <SelectField
              label="Tipo"
              name="type"
              options={[
                ["SEDE", "Sede"],
                ["ESCOLA_POLO", "Escola polo"],
              ]}
            />
            <Field label="Endereço" name="address" />
            <Button>Cadastrar polo</Button>
          </form>
        </Panel>
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Nova turma</h2>
          <form action={createTurma} className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1.5 text-sm text-neutral-300">
              Turma
              <select
                name="name"
                required
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
              >
                {Array.from({ length: 8 }, (_, index) => (
                  <option key={index + 1} value={`Turma ${index + 1}`}>
                    Turma {index + 1}
                  </option>
                ))}
              </select>
            </label>
            <SelectField
              label="Polo"
              name="poloId"
              options={polos.map((polo) => [polo.id, polo.name] as [string, string])}
            />
            <SelectField
              label="Modalidade"
              name="modality"
              options={[
                ["FUTEBOL", "Futebol"],
                ["FUTSAL", "Futsal"],
                ["XADREZ", "Xadrez"],
                ["REFORCO_ESCOLAR", "Reforço escolar"],
                ["HORTA", "Horta"],
                ["OUTRO", "Outro"],
              ]}
            />
            <SelectField
              label="Turno"
              name="shift"
              options={[
                ["MANHA", "Manhã"],
                ["TARDE", "Tarde"],
                ["NOITE", "Noite"],
              ]}
            />
            <Field label="Início" name="startTime" type="time" required />
            <Field label="Fim" name="endTime" type="time" required />
            <label className="text-sm">
              Professor
              <select
                name="professorId"
                className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
              >
                <option value="">Sem professor</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="flex flex-wrap gap-2 text-xs text-neutral-300 md:col-span-2">
              <legend className="mb-2">Dias da semana</legend>
              {weekdays.map(([value, label]) => (
                <label key={value} className="flex gap-1">
                  <input type="checkbox" name="weekdays" value={value} />
                  {label}
                </label>
              ))}
            </fieldset>
            <div className="md:col-span-2">
              <Button>Criar turma</Button>
            </div>
          </form>
        </Panel>
      </div>
      <div className="mt-6 space-y-4">
        {polos.map((polo) => (
          <Panel key={polo.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{polo.name}</h2>
                <p className="text-sm text-neutral-500">
                  {labelFor(polo.type)} · {polo.address ?? "Endereço não informado"} · {polo._count.alunos} alunos
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge tone={polo.active ? "green" : "neutral"}>{polo.active ? "Ativo" : "Inativo"}</StatusBadge>
                <PoloEditDialog polo={polo} />
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-neutral-500">
                  <tr>
                    <th className="py-2">Turma</th>
                    <th>Modalidade</th>
                    <th>Horário</th>
                    <th>Professor</th>
                    <th>Alunos</th>
                    <th>Status / ação</th>
                  </tr>
                </thead>
                <tbody>
                  {polo.turmas.map((turma) => (
                    <tr key={turma.id} className="border-t border-neutral-800">
                      <td className="py-2">{turma.name}</td>
                      <td>{labelFor(turma.modality)}</td>
                      <td>
                        {labelFor(turma.shift)} · {turma.startTime}–{turma.endTime}
                      </td>
                      <td>{turma.professor?.name ?? "—"}</td>
                      <td>{turma._count.alunos}</td>
                      <td className="flex items-center gap-3 py-2">
                        <StatusBadge tone={turma.active ? "green" : "neutral"}>
                          {turma.active ? "Ativa" : "Inativa"}
                        </StatusBadge>
                        <TurmaEditDialog turma={turma} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!polo.turmas.length && (
                <p className="py-4 text-sm text-neutral-500">Nenhuma turma cadastrada neste polo.</p>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
