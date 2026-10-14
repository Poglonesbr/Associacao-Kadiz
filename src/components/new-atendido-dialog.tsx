"use client";

import { useState } from "react";
import { createAtendido } from "@/app/actions/atendidos";
import { DateInput } from "@/components/date-input";
import { Button, SelectField } from "@/components/ui";

type StudentOption = { id: string; fullName: string; polo: { name: string } };

export function NewAtendidoDialog({ students }: { students: StudentOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        + Novo atendido
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation">
          <section
            aria-labelledby="new-atendido-title"
            aria-modal="true"
            className="w-full max-w-xl rounded-xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl"
            role="dialog"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-emerald-400">Equipe técnica</p>
                <h2 className="mt-1 text-xl font-semibold text-white" id="new-atendido-title">
                  Novo atendido
                </h2>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                className="text-neutral-400 hover:text-white"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <form action={createAtendido} className="space-y-4">
              <SelectField
                label="Aluno do Projeto Social"
                name="alunoId"
                required
                options={students.map(
                  (student) => [student.id, `${student.fullName} · ${student.polo.name}`] as [string, string],
                )}
              />
              <DateInput label="Data de ingresso no acompanhamento" name="ingressoDate" required />
              <SelectField
                label="Origem"
                name="origem"
                options={[
                  ["", "Selecione"],
                  ["DEMANDA_ESPONTANEA", "Demanda espontânea"],
                  ["ESCOLA", "Escola"],
                  ["CONSELHO_TUTELAR", "Conselho Tutelar"],
                  ["CRAS", "CRAS"],
                  ["EQUIPE_KADIZ", "Equipe Kadiz"],
                  ["OUTRO", "Outro"],
                ]}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button>Criar ficha técnica</Button>
              </div>
              {!students.length && (
                <p className="text-sm text-amber-300">
                  Todos os alunos ativos do Projeto Social já possuem ficha técnica.
                </p>
              )}
            </form>
          </section>
        </div>
      )}
    </>
  );
}
