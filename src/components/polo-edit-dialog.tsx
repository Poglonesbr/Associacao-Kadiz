"use client";

import { useState } from "react";
import { updatePolo, updateTurma } from "@/app/actions/polos";
import { TimeInput } from "@/components/date-input";

type PoloRecord = { id: string; name: string; type: string; address: string | null; active: boolean };
type TurmaRecord = {
  id: string;
  name: string;
  shift: string;
  weekdays: string[];
  startTime: string;
  endTime: string;
  modality: string;
  active: boolean;
};

const fieldClass = "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm";
const weekdays = [
  ["SEG", "Segunda"],
  ["TER", "Terça"],
  ["QUA", "Quarta"],
  ["QUI", "Quinta"],
  ["SEX", "Sexta"],
  ["SAB", "Sábado"],
];

export function PoloEditDialog({ polo }: { polo: PoloRecord }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-800"
      >
        Editar polo
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`polo-${polo.id}`}
            className="w-full max-w-lg rounded-xl border border-neutral-700 bg-neutral-900 p-6"
          >
            <div className="mb-5 flex justify-between">
              <h2 id={`polo-${polo.id}`} className="text-lg font-semibold">
                Editar polo
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">
                ✕
              </button>
            </div>
            <form action={updatePolo} className="space-y-4">
              <input type="hidden" name="id" value={polo.id} />
              <label className="block space-y-1 text-sm">
                Nome
                <input name="name" defaultValue={polo.name} required minLength={2} className={fieldClass} />
              </label>
              <label className="block space-y-1 text-sm">
                Tipo
                <select name="type" defaultValue={polo.type} className={fieldClass}>
                  <option value="SEDE">Sede</option>
                  <option value="ESCOLA_POLO">Escola polo</option>
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                Endereço
                <input name="address" defaultValue={polo.address ?? ""} className={fieldClass} />
              </label>
              <label className="block space-y-1 text-sm">
                Status
                <select name="active" defaultValue={String(polo.active)} className={fieldClass}>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-neutral-700 px-3 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-black">
                  Salvar alterações
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

export function TurmaEditDialog({ turma }: { turma: TurmaRecord }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-800"
      >
        Editar turma
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`turma-${turma.id}`}
            className="my-auto w-full max-w-2xl rounded-xl border border-neutral-700 bg-neutral-900 p-6"
          >
            <div className="mb-5 flex justify-between">
              <h2 id={`turma-${turma.id}`} className="text-lg font-semibold">
                Editar turma
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">
                ✕
              </button>
            </div>
            <form action={updateTurma} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="id" value={turma.id} />
              <label className="space-y-1 text-sm">
                Nome
                <input name="name" defaultValue={turma.name} required minLength={2} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm">
                Modalidade
                <select name="modality" defaultValue={turma.modality} className={fieldClass}>
                  <option value="FUTEBOL">Futebol</option>
                  <option value="FUTSAL">Futsal</option>
                  <option value="XADREZ">Xadrez</option>
                  <option value="REFORCO_ESCOLAR">Reforço escolar</option>
                  <option value="HORTA">Horta</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                Turno
                <select name="shift" defaultValue={turma.shift} className={fieldClass}>
                  <option value="MANHA">Manhã</option>
                  <option value="TARDE">Tarde</option>
                  <option value="NOITE">Noite</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                Status
                <select name="active" defaultValue={String(turma.active)} className={fieldClass}>
                  <option value="true">Ativa</option>
                  <option value="false">Inativa</option>
                </select>
              </label>
              <TimeInput label="Início" name="startTime" defaultValue={turma.startTime} required />
              <TimeInput label="Fim" name="endTime" defaultValue={turma.endTime} required />
              <fieldset className="flex flex-wrap gap-3 text-sm text-neutral-300 md:col-span-2">
                <legend className="mb-2">Dias da semana</legend>
                {weekdays.map(([value, label]) => (
                  <label key={value} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      name="weekdays"
                      value={value}
                      defaultChecked={turma.weekdays.includes(value)}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <div className="flex justify-end gap-2 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-neutral-700 px-3 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-black">
                  Salvar alterações
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
