"use client";

import { useState } from "react";
import { createStudent } from "@/app/actions/alunos";
import { Button, Field, SelectField } from "@/components/ui";

const steps = ["Vínculo", "Aluno", "Família", "Contato", "Esportivo", "Financeiro", "Autorizações", "Revisão"];

export function StudentWizard({
  polos,
  turmas,
}: {
  polos: { id: string; name: string }[];
  turmas: { id: string; name: string; poloId: string }[];
}) {
  const [step, setStep] = useState(0);
  const [vinculo, setVinculo] = useState("PROJETO_SOCIAL");
  const [poloId, setPoloId] = useState("");
  const visibleSteps = steps
    .map((label, index) => ({ label, index }))
    .filter(({ index }) => vinculo === "PARTICULAR" || index !== 5);
  function next() {
    const current = document.querySelector<HTMLElement>(`[data-step="${step}"]`);
    const required = current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>(":required");
    if (required && Array.from(required).some((input) => !input.value || !input.checkValidity())) {
      required?.forEach((input) => {
        if (!input.value) input.reportValidity();
      });
      return;
    }
    const currentIndex = visibleSteps.findIndex(({ index }) => index === step);
    setStep(visibleSteps[Math.min(currentIndex + 1, visibleSteps.length - 1)].index);
  }
  return (
    <form action={createStudent} className="mx-auto max-w-3xl">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Nova matrícula</p>
        <h1 className="mt-1 text-2xl font-semibold">Cadastro de Aluno</h1>
      </div>
      <div className="mb-6 grid grid-cols-5 gap-2 md:grid-cols-9">
        {visibleSteps.map(({ label, index }) => (
          <button type="button" key={label} onClick={() => setStep(index)} className="min-w-0 text-center">
            <span className={`mb-1 block h-1 rounded-full ${step >= index ? "bg-emerald-400" : "bg-neutral-800"}`} />
            <span className="text-[10px] text-neutral-400">{label}</span>
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 md:p-8">
        <div data-step={0} className={step === 0 ? "space-y-4" : "hidden"}>
          <h2 className="mb-3 text-lg font-semibold">Tipo de vínculo</h2>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-neutral-300">Vínculo</span>
            <select
              name="vinculo"
              value={vinculo}
              onChange={(event) => {
                setVinculo(event.target.value);
                setStep(0);
              }}
              required
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
            >
              <option value="PROJETO_SOCIAL">Projeto Social — gratuito</option>
              <option value="PARTICULAR">Particular</option>
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-300">Polo</span>
              <select
                name="poloId"
                value={poloId}
                onChange={(event) => setPoloId(event.target.value)}
                required
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              >
                <option value="">Selecione o polo</option>
                {polos.map((polo) => (
                  <option value={polo.id} key={polo.id}>
                    {polo.name}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Data de início" name="startDate" type="date" />
          </div>
        </div>
        <div data-step={1} className={step === 1 ? "space-y-4" : "hidden"}>
          <h2 className="mb-3 text-lg font-semibold">Dados do aluno</h2>
          <Field label="Nome completo" name="fullName" required />
          <Field label="Nome social (se houver)" name="socialName" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Data de nascimento" name="birthDate" type="date" required />
            <Field label="CPF" name="cpf" />
            <Field label="RG" name="rg" />
            <Field label="Naturalidade" name="naturalidade" />
            <Field label="Sexo" name="sex" />
            <Field label="Etnia" name="ethnicity" />
            <Field label="Endereço" name="address" />
            <Field label="Número" name="addressNumber" />
            <Field label="Bairro" name="neighborhood" />
            <Field label="Cidade" name="city" />
            <Field label="UF" name="state" defaultValue="SC" />
            <Field label="CEP" name="postalCode" placeholder="88340-000" />
            <Field label="Escola" name="school" />
            <Field label="Série escolar" name="schoolGrade" />
            <SelectField
              label="Turno escolar"
              name="schoolShift"
              options={[
                ["", "Selecione"],
                ["MATUTINO", "Matutino"],
                ["VESPERTINO", "Vespertino"],
              ]}
            />
          </div>
        </div>
        <div data-step={2} className={step === 2 ? "space-y-4" : "hidden"}>
          <h2 className="mb-3 text-lg font-semibold">Família e responsável</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome do responsável" name="guardianName" required />
            <SelectField
              label="Parentesco"
              name="guardianRelation"
              required
              options={[
                ["MAE", "Mãe"],
                ["PAI", "Pai"],
                ["AVO", "Avó/Avô"],
                ["TIO", "Tio(a)"],
                ["IRMAO", "Irmão(ã)"],
                ["TUTOR", "Tutor(a)"],
                ["OUTRO", "Outro"],
              ]}
            />
            <Field label="Nome da mãe" name="motherName" />
            <Field label="Profissão da mãe" name="motherJob" />
            <Field label="Telefone da mãe" name="motherPhone" />
            <Field label="Nome do pai" name="fatherName" />
            <Field label="Profissão do pai" name="fatherJob" />
            <Field label="Telefone do pai" name="fatherPhone" />
            <Field label="Outro responsável" name="otherGuardian" />
            {vinculo === "PROJETO_SOCIAL" && (
              <Field label="Quantas pessoas moram na residência" name="householdSize" type="number" />
            )}
          </div>
        </div>
        <div data-step={3} className={step === 3 ? "space-y-4" : "hidden"}>
          <h2 className="mb-3 text-lg font-semibold">Contato do responsável</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="E-mail" name="guardianEmail" type="email" />
            <Field label="Telefone" name="guardianPhone" type="tel" />
            <Field label="CPF do responsável" name="guardianCpf" />
          </div>
        </div>
        <div data-step={4} className={step === 4 ? "space-y-4" : "hidden"}>
          <h2 className="mb-3 text-lg font-semibold">Dados Esportivos & Saúde</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Turma"
              name="turmaId"
              options={[
                ["", "Selecionar depois"],
                ...turmas
                  .filter((turma) => !poloId || turma.poloId === poloId)
                  .map((turma) => [turma.id, turma.name] as [string, string]),
              ]}
            />
            <Field label="Posição" name="position" />
            <Field label="Número da camisa" name="shirtNumber" />
            <SelectField
              label="Pé dominante"
              name="dominantFoot"
              options={[
                ["", "Selecionar"],
                ["DESTRO", "Destro"],
                ["CANHOTO", "Canhoto"],
                ["AMBIDESTRO", "Ambidestro"],
              ]}
            />
            <SelectField
              label="Convênio médico"
              name="hasHealthPlan"
              options={[
                ["", "Selecione"],
                ["true", "Sim"],
                ["false", "Não"],
              ]}
            />
            <Field label="Tipo sanguíneo" name="bloodType" />
            <Field label="Doença crônica" name="chronicDisease" />
            <Field label="Medicação contínua" name="continuousMedication" />
            <Field label="Alergias" name="allergies" />
            <Field label="Restrições alimentares" name="foodRestrictions" />
            <Field label="Cirurgias" name="surgeries" />
            <Field label="Cartão SUS" name="susCard" />
            <Field label="Escola" name="school" />
            <Field label="Série" name="schoolGrade" />
            <SelectField
              label="Acompanhamento psicológico"
              name="psychFollowUp"
              options={[
                ["false", "Não"],
                ["true", "Sim"],
              ]}
            />
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Dias de treino</p>
            <div className="flex flex-wrap gap-3">
              {[
                ["SEG", "Segunda"],
                ["TER", "Terça"],
                ["QUA", "Quarta"],
                ["QUI", "Quinta"],
                ["SEX", "Sexta"],
                ["SAB", "Sábado"],
              ].map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-sm text-neutral-300">
                  <input name="weekdays" value={v} type="checkbox" />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Dificuldades identificadas</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                ["ALIMENTACAO", "Alimentação"],
                ["TOC", "TOC"],
                ["COMUNICACAO", "Comunicação"],
                ["SONO", "Sono"],
                ["MOTOR", "Desenvolvimento motor"],
                ["ESCOLAR", "Contexto escolar"],
                ["SOCIALIZACAO", "Socialização"],
                ["AGUA", "Beber água"],
              ].map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-sm text-neutral-300">
                  <input name="difficulties" type="checkbox" value={v} />
                  {l}
                </label>
              ))}
            </div>
            <Field label="Outra dificuldade" name="difficultiesOther" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Contato de emergência" name="emergencyName" />
            <Field label="Parentesco" name="emergencyRelation" />
            <Field label="Telefone de emergência" name="emergencyPhone" />
            <Field label="Observações médicas" name="medicalNotes" />
          </div>
        </div>
        <div data-step={5} className={step === 5 ? "space-y-4" : "hidden"}>
          <h2 className="mb-3 text-lg font-semibold">Plano financeiro</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Mensalidade (R$)" name="monthlyFee" type="currency" placeholder="Ex.: 250,00" />
            <Field label="Dia de cobrança" name="billingDay" type="number" />
            <Field label="Nome para nota fiscal" name="invoiceName" />
            <Field label="CPF para nota fiscal" name="invoiceCpf" />
            <Field label="E-mail para nota fiscal" name="invoiceEmail" type="email" />
          </div>
          <p className="text-xs text-neutral-500">
            Aceita formato brasileiro com vírgula. A primeira fatura vence em 15 dias.
          </p>
        </div>
        <div data-step={6} className={step === 6 ? "space-y-4" : "hidden"}>
          <h2 className="mb-3 text-lg font-semibold">Autorizações</h2>
          {[
            ["authTrips", "Autorização para passeios e viagens"],
            ["authImage", "Autorização para uso de imagem"],
            ["authTermsAccepted", "Li e aceito os termos do projeto e LGPD"],
          ].map(([name, label]) => (
            <label key={name} className="flex items-center gap-3 rounded-lg border border-neutral-800 p-3 text-sm">
              <input name={name} type="checkbox" />
              {label}
            </label>
          ))}
        </div>
        <div data-step={7} className={step === 7 ? "space-y-4" : "hidden"}>
          <h2 className="mb-3 text-lg font-semibold">Revisão</h2>
          <p className="text-sm text-neutral-400">
            Confira os dados informados. Documentos serão entregues pela equipe e ficarão pendentes até a conferência.
          </p>
          <p className="rounded-lg bg-neutral-950 p-4 text-sm text-neutral-300">
            Cadastro do vínculo <b>{vinculo === "PARTICULAR" ? "Particular" : "Projeto Social"}</b>. Revise as etapas
            anteriores antes de concluir.
          </p>
        </div>
        <div className="mt-7 flex justify-between">
          <Button
            type="button"
            variant="secondary"
            className={step === 0 ? "invisible" : ""}
            onClick={() =>
              setStep(visibleSteps[Math.max(0, visibleSteps.findIndex(({ index }) => index === step) - 1)].index)
            }
          >
            Voltar
          </Button>
          {step !== visibleSteps[visibleSteps.length - 1].index ? (
            <Button type="button" onClick={next}>
              Avançar
            </Button>
          ) : (
            <Button>Concluir cadastro</Button>
          )}
        </div>
      </div>
    </form>
  );
}
