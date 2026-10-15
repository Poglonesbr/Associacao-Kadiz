"use client";

import { useState, type ReactNode } from "react";
import { updateAtendido } from "@/app/actions/atendidos";
import { DateInput } from "@/components/date-input";
import { Button, Field, SelectField } from "@/components/ui";
import { formatBrazilianDate, maskBrazilianDate } from "@/lib/dates";
import { labelFor } from "@/lib/labels";
import { formatBrazilianCurrencyInput } from "@/lib/money";

type AreaRow = {
  area: string;
  necessidade: string | null;
  acoes: string | null;
  prazoResponsavel: string | null;
  status: string;
};
type GoalRow = { objetivo: string; meta: string | null; acoes: string | null; prazo: string | null; avaliacao: string };
type Student = {
  id: string;
  fullName: string;
  socialName: string | null;
  birthDate: Date;
  cpf: string | null;
  rg: string | null;
  matricula: string;
  polo: { name: string };
  turma: { name: string } | null;
  guardianName: string;
  guardianPhone: string | null;
  guardianEmail: string | null;
  motherName: string | null;
  fatherName: string | null;
  address: string | null;
  addressNumber: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  school: string | null;
  schoolGrade: string | null;
  schoolShift: string | null;
  householdSize: number | null;
};
type TechnicalUser = { id: string; name: string | null; jobTitle: string | null };
type Objective = { title: string; description: string | null };

const controlClass =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none";

function Section({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="border-b border-neutral-800 px-5 py-5">
      <h2 className="mb-4 flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-emerald-300">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-950 text-xs">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function AtendidoEditor({
  record,
  student,
  areas: initialAreas,
  goals: initialGoals,
  technicalUsers,
  objectives,
}: {
  record: {
    id: string;
    ingressoDate: Date;
    origem: string | null;
    responsavelTecnicoId: string | null;
    nextReviewDate: Date | null;
    familyIncome: string | null;
    incomeSources: string | null;
    nis: string | null;
    bolsaFamilia: boolean;
    otherBenefits: string | null;
    crasReference: string | null;
    conselhoTutelar: boolean;
    conselhoTutelarNotes: string | null;
    housingType: string | null;
    housingNotes: string | null;
    vulnerabilities: string[];
    currentSituation: string | null;
    familyHistory: string | null;
    potentialities: string | null;
  };
  student: Student;
  areas: AreaRow[];
  goals: GoalRow[];
  technicalUsers: TechnicalUser[];
  objectives: Objective[];
}) {
  const [areas, setAreas] = useState(initialAreas);
  const [goals, setGoals] = useState(
    initialGoals.map((goal) => ({ ...goal, prazo: goal.prazo ? formatBrazilianDate(goal.prazo) : null })),
  );
  const vulnerabilityOptions = [
    "VIOLENCIA",
    "NEGLIGENCIA",
    "TRABALHO_INFANTIL",
    "EVASAO_ESCOLAR",
    "INSEGURANCA_ALIMENTAR",
    "USO_SUBSTANCIAS_FAMILIA",
    "DEFICIENCIA",
    "OUTRAS",
  ];

  function updateArea(index: number, key: keyof AreaRow, value: string) {
    setAreas((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  }

  function updateGoal(index: number, key: keyof GoalRow, value: string) {
    setGoals((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  }

  return (
    <form
      action={updateAtendido}
      className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
      id="atendido-form"
    >
      <input type="hidden" name="id" value={record.id} />
      <input type="hidden" name="areas" value={JSON.stringify(areas)} />
      <input type="hidden" name="goals" value={JSON.stringify(goals)} />
      <Section number={1} title="Identificação e dados socioeconômicos">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Nome", student.fullName],
            ["Nome social (se houver)", student.socialName ?? "—"],
            ["Nascimento", formatBrazilianDate(student.birthDate)],
            ["CPF / RG", [student.cpf, student.rg].filter(Boolean).join(" / ") || "—"],
            ["Matrícula", student.matricula],
            ["Polo", student.polo.name],
            ["Turma", student.turma?.name ?? "Sem turma"],
            ["Responsável", student.guardianName],
            ["Telefone / contato", student.guardianPhone ?? "—"],
            ["E-mail do responsável", student.guardianEmail ?? "—"],
            ["Mãe", student.motherName ?? "—"],
            ["Pai", student.fatherName ?? "—"],
            [
              "Endereço",
              [
                student.address,
                student.addressNumber,
                student.neighborhood,
                student.city,
                student.state,
                student.postalCode ? `CEP ${student.postalCode}` : null,
              ]
                .filter(Boolean)
                .join(", ") || "—",
            ],
            ["Escola", student.school ?? "—"],
            [
              "Série / turno",
              [student.schoolGrade, student.schoolShift ? labelFor(student.schoolShift) : null]
                .filter(Boolean)
                .join(" · ") || "—",
            ],
            ["Pessoas na residência", student.householdSize?.toString() ?? "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-neutral-500">{label}</p>
              <p className="mt-1 text-sm text-neutral-200">{value}</p>
            </div>
          ))}
          <datalist id="pia-objectives">
            {objectives.map((objective) => (
              <option key={objective.title} value={objective.title}>
                {objective.description ?? ""}
              </option>
            ))}
          </datalist>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <DateInput
            label="Ingresso no acompanhamento"
            name="ingressoDate"
            defaultValue={record.ingressoDate}
            required
          />
          <SelectField
            label="Origem"
            name="origem"
            defaultValue={record.origem ?? ""}
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
          <SelectField
            label="Responsável técnico"
            name="responsavelTecnicoId"
            defaultValue={record.responsavelTecnicoId ?? ""}
            options={[
              ["", "Sem responsável"],
              ...technicalUsers.map(
                (item) =>
                  [item.id, `${item.name ?? "Técnico"}${item.jobTitle ? ` · ${item.jobTitle}` : ""}`] as [
                    string,
                    string,
                  ],
              ),
            ]}
          />
          <DateInput label="Próxima reavaliação" name="nextReviewDate" defaultValue={record.nextReviewDate} />
          <Field
            label="Renda familiar (R$)"
            name="familyIncome"
            type="currency"
            defaultValue={formatBrazilianCurrencyInput(record.familyIncome)}
            placeholder="0,00"
          />
          <Field label="Fontes de renda" name="incomeSources" defaultValue={record.incomeSources ?? ""} />
          <Field label="NIS" name="nis" defaultValue={record.nis ?? ""} />
          <Field label="Outros benefícios" name="otherBenefits" defaultValue={record.otherBenefits ?? ""} />
          <Field label="Referência CRAS" name="crasReference" defaultValue={record.crasReference ?? ""} />
          <SelectField
            label="Tipo de moradia"
            name="housingType"
            defaultValue={record.housingType ?? ""}
            options={[
              ["", "Selecione"],
              ...["PROPRIA", "ALUGADA", "CEDIDA", "OCUPACAO", "OUTRA"].map(
                (value) => [value, labelFor(value)] as [string, string],
              ),
            ]}
          />
          <Field label="Observações sobre moradia" name="housingNotes" defaultValue={record.housingNotes ?? ""} />
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" name="bolsaFamilia" value="true" defaultChecked={record.bolsaFamilia} />
            Recebe Bolsa Família
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" name="conselhoTutelar" value="true" defaultChecked={record.conselhoTutelar} />
            Acompanhamento pelo Conselho Tutelar
          </label>
          <Field
            label="Observações do Conselho Tutelar"
            name="conselhoTutelarNotes"
            defaultValue={record.conselhoTutelarNotes ?? ""}
          />
        </div>
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium text-neutral-300">Vulnerabilidades identificadas</legend>
          <div className="flex flex-wrap gap-3">
            {vulnerabilityOptions.map((item) => (
              <label className="flex items-center gap-2 text-xs text-neutral-300" key={item}>
                <input
                  type="checkbox"
                  name="vulnerabilities"
                  value={item}
                  defaultChecked={record.vulnerabilities.includes(item)}
                />
                {labelFor(item)}
              </label>
            ))}
          </div>
        </fieldset>
      </Section>
      <Section number={2} title="Situação atual e histórico">
        <div className="grid gap-4">
          <label className="space-y-1.5 text-sm text-neutral-300">
            Situação atual / principais demandas
            <textarea
              className={controlClass}
              name="currentSituation"
              rows={3}
              defaultValue={record.currentSituation ?? ""}
            />
          </label>
          <label className="space-y-1.5 text-sm text-neutral-300">
            Histórico familiar, social e de moradia
            <textarea
              className={controlClass}
              name="familyHistory"
              rows={3}
              defaultValue={record.familyHistory ?? ""}
            />
          </label>
          <label className="space-y-1.5 text-sm text-neutral-300">
            Potencialidades, interesses e recursos pessoais
            <textarea
              className={controlClass}
              name="potentialities"
              rows={3}
              defaultValue={record.potentialities ?? ""}
            />
          </label>
        </div>
      </Section>
      <Section number={3} title="Áreas de atendimento e avaliação">
        <div className="space-y-3">
          {areas.map((row, index) => (
            <div
              className="grid gap-2 rounded-lg border border-neutral-800 p-3 md:grid-cols-[1fr_1.2fr_1.2fr_1fr_1fr]"
              key={row.area}
            >
              <p className="self-center text-sm font-medium text-white">{labelFor(row.area)}</p>
              <input
                className={controlClass}
                aria-label={`${labelFor(row.area)}: necessidade`}
                placeholder="Situação / necessidade"
                value={row.necessidade ?? ""}
                onChange={(event) => updateArea(index, "necessidade", event.target.value)}
              />
              <input
                className={controlClass}
                aria-label={`${labelFor(row.area)}: ações`}
                placeholder="Ações / encaminhamentos"
                value={row.acoes ?? ""}
                onChange={(event) => updateArea(index, "acoes", event.target.value)}
              />
              <input
                className={controlClass}
                aria-label={`${labelFor(row.area)}: prazo`}
                placeholder="Prazo / responsável"
                value={row.prazoResponsavel ?? ""}
                onChange={(event) => updateArea(index, "prazoResponsavel", event.target.value)}
              />
              <select
                className={controlClass}
                aria-label={`${labelFor(row.area)}: status interno`}
                value={row.status}
                onChange={(event) => updateArea(index, "status", event.target.value)}
              >
                {["SEM_DEMANDA", "IDENTIFICADA", "EM_ACOMPANHAMENTO", "RESOLVIDA"].map((status) => (
                  <option key={status} value={status}>
                    {labelFor(status)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-neutral-500">O status é interno, alimenta o painel e não aparece no PDF.</p>
      </Section>
      <Section number={4} title="Objetivos e metas do PIA">
        <div className="space-y-3">
          {goals.map((goal, index) => (
            <div className="grid gap-2 rounded-lg border border-neutral-800 p-3 md:grid-cols-5" key={index}>
              <input
                className={controlClass}
                placeholder="Objetivo"
                list="pia-objectives"
                value={goal.objetivo}
                onChange={(event) => updateGoal(index, "objetivo", event.target.value)}
              />
              <input
                className={controlClass}
                placeholder="Meta / resultado esperado"
                value={goal.meta ?? ""}
                onChange={(event) => updateGoal(index, "meta", event.target.value)}
              />
              <input
                className={controlClass}
                placeholder="Ações previstas"
                value={goal.acoes ?? ""}
                onChange={(event) => updateGoal(index, "acoes", event.target.value)}
              />
              <input
                className={controlClass}
                aria-label="Prazo da meta"
                placeholder="Prazo dd/mm/aaaa"
                value={formatBrazilianDate(goal.prazo)}
                onChange={(event) => updateGoal(index, "prazo", maskBrazilianDate(event.target.value))}
              />
              <select
                className={controlClass}
                aria-label="Avaliação da meta"
                value={goal.avaliacao}
                onChange={(event) => updateGoal(index, "avaliacao", event.target.value)}
              >
                {["NAO_INICIADA", "EM_ANDAMENTO", "ALCANCADA", "NAO_ALCANCADA"].map((status) => (
                  <option key={status} value={status}>
                    {labelFor(status)}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setGoals((current) => [
                ...current,
                { objetivo: "", meta: null, acoes: null, prazo: null, avaliacao: "NAO_INICIADA" },
              ])
            }
          >
            + Adicionar meta
          </Button>
          <p className="text-xs text-neutral-500">Metas deixadas em branco serão descartadas ao salvar.</p>
        </div>
      </Section>
      <div className="flex justify-end p-5">
        <Button>Salvar alterações da ficha</Button>
      </div>
    </form>
  );
}
