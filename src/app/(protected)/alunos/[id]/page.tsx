import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { updateStudent } from "@/app/actions/alunos";
import { DataTable, EmptyState, Field, LinkButton, PageHeader, Panel, SelectField, StatusBadge } from "@/components/ui";
import { requirePermission } from "@/lib/guards";
import { can, canViewStudentFinancial, isTecnico } from "@/lib/permissions";
import { labelFor } from "@/lib/labels";
import { formatBrazilianCurrency, formatBrazilianCurrencyInput } from "@/lib/money";
import { hasDisengagementRisk } from "@/lib/rules";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Tab = "dados" | "familia" | "saude" | "autorizacoes" | "documentos" | "frequencia" | "financeiro" | "entregas";
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; edit?: string }>;
};

function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg bg-neutral-950/70 p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 break-words text-sm text-neutral-200">{value ? String(value) : "—"}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-neutral-200">{title}</h2>
      {children}
    </section>
  );
}

const difficulties = [
  ["ALIMENTACAO", "Alimentação"],
  ["TOC", "TOC"],
  ["COMUNICACAO", "Comunicação"],
  ["SONO", "Sono"],
  ["MOTOR", "Desenvolvimento motor"],
  ["ESCOLAR", "Contexto escolar"],
  ["SOCIALIZACAO", "Socialização"],
  ["AGUA", "Beber água"],
];
const weekdays = [
  ["SEG", "Segunda"],
  ["TER", "Terça"],
  ["QUA", "Quarta"],
  ["QUI", "Quinta"],
  ["SEX", "Sexta"],
  ["SAB", "Sábado"],
];

export default async function StudentDetailPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requirePermission("students:view");
  const canEdit = can(user, "students:write");
  const canViewFinance = canViewStudentFinancial(user);
  const student = await prisma.aluno.findUnique({
    where: { id },
    include: {
      polo: true,
      turma: true,
      documents: { orderBy: { type: "asc" } },
      attendanceRecords: { include: { session: true }, orderBy: { session: { date: "desc" } } },
      invoices: { orderBy: { dueDate: "desc" } },
      stockMovements: { include: { item: true }, orderBy: { date: "desc" } },
      atendido: { select: { id: true } },
    },
  });
  if (!student) notFound();
  const [polos, turmas] = await Promise.all([
    prisma.polo.findMany({ orderBy: { name: "asc" } }),
    prisma.turma.findMany({ include: { polo: true }, orderBy: [{ polo: { name: "asc" } }, { name: "asc" }] }),
  ]);

  const availableTabs: { key: Tab; label: string }[] = [
    { key: "dados", label: "Dados" },
    { key: "familia", label: "Família / Responsável" },
    { key: "saude", label: "Saúde" },
    { key: "autorizacoes", label: "Autorizações" },
    { key: "documentos", label: "Documentos" },
    { key: "frequencia", label: "Frequência" },
    ...(canViewFinance ? [{ key: "financeiro" as const, label: "Financeiro" }] : []),
    { key: "entregas", label: "Entregas" },
  ];
  const requestedTab = query.tab as Tab | undefined;
  const activeTab = availableTabs.some((tab) => tab.key === requestedTab) ? requestedTab! : "dados";
  const editing = query.edit === "1" && canEdit;
  const editLink = `/alunos/${student.id}?tab=${activeTab}&edit=1`;
  const viewLink = `/alunos/${student.id}?tab=${activeTab}`;
  const absences = student.attendanceRecords.filter((record) => record.status === "FALTA");
  const attendanceRisk = hasDisengagementRisk(
    student.attendanceRecords.map((record) => ({ status: record.status, date: record.session.date })),
    new Date().getFullYear(),
  );

  return (
    <>
      <PageHeader
        eyebrow={`${student.polo.name} · ${student.matricula}`}
        title={student.fullName}
        action={
          <div className="flex gap-2">
            {student.atendido && isTecnico(user) && (
              <LinkButton href={`/atendidos/${student.atendido.id}`} variant="secondary">
                Ver acompanhamento técnico
              </LinkButton>
            )}
            {canEdit && (
              <LinkButton href={editing ? viewLink : editLink} variant={editing ? "secondary" : "primary"}>
                {editing ? "Cancelar edição" : "Editar ficha"}
              </LinkButton>
            )}
          </div>
        }
      />
      <div className="mb-5 flex flex-wrap gap-2 border-b border-neutral-800">
        {availableTabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/alunos/${student.id}?tab=${tab.key}${editing ? "&edit=1" : ""}`}
            className={`border-b-2 px-3 py-3 text-sm ${activeTab === tab.key ? "border-emerald-400 text-white" : "border-transparent text-neutral-400 hover:text-white"}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {editing ? (
        <form action={updateStudent} className="space-y-6 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <input type="hidden" name="id" value={student.id} />
          {activeTab === "dados" && (
            <Section title="Identificação e matrícula">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome completo" name="fullName" defaultValue={student.fullName} required />
                <SelectField
                  label="Vínculo"
                  name="vinculo"
                  defaultValue={student.vinculo}
                  options={[
                    ["PROJETO_SOCIAL", "Projeto Social"],
                    ["PARTICULAR", "Particular"],
                  ]}
                />
                <SelectField
                  label="Polo"
                  name="poloId"
                  defaultValue={student.poloId}
                  options={polos.map((polo) => [polo.id, polo.name] as [string, string])}
                />
                <SelectField
                  label="Turma"
                  name="turmaId"
                  defaultValue={student.turmaId ?? ""}
                  options={[
                    ["", "Sem turma"],
                    ...turmas.map((turma) => [turma.id, `${turma.polo.name} · ${turma.name}`] as [string, string]),
                  ]}
                />
                <Field
                  label="Data de nascimento"
                  name="birthDate"
                  type="date"
                  defaultValue={student.birthDate.toISOString().slice(0, 10)}
                  required
                />
                <Field
                  label="Data de início"
                  name="startDate"
                  type="date"
                  defaultValue={student.startDate?.toISOString().slice(0, 10) ?? ""}
                />
                <Field label="CPF" name="cpf" defaultValue={student.cpf ?? ""} />
                <Field label="RG" name="rg" defaultValue={student.rg ?? ""} />
                <Field label="Sexo" name="sex" defaultValue={student.sex ?? ""} />
                <Field label="Etnia" name="ethnicity" defaultValue={student.ethnicity ?? ""} />
                <Field label="Naturalidade" name="naturalidade" defaultValue={student.naturalidade ?? ""} />
                <Field label="Endereço" name="address" defaultValue={student.address ?? ""} />
                <Field label="Número" name="addressNumber" defaultValue={student.addressNumber ?? ""} />
                <Field label="Bairro" name="neighborhood" defaultValue={student.neighborhood ?? ""} />
                <Field label="Cidade" name="city" defaultValue={student.city ?? ""} />
                <Field label="UF" name="state" defaultValue={student.state ?? ""} />
                <Field label="CEP" name="postalCode" defaultValue={student.postalCode ?? ""} />
                <Field label="Escola" name="school" defaultValue={student.school ?? ""} />
                <Field label="Série escolar" name="schoolGrade" defaultValue={student.schoolGrade ?? ""} />
                <SelectField
                  label="Turno escolar"
                  name="schoolShift"
                  defaultValue={student.schoolShift ?? ""}
                  options={[
                    ["", "Selecione"],
                    ["MATUTINO", "Matutino"],
                    ["VESPERTINO", "Vespertino"],
                  ]}
                />
                <Field label="Posição" name="position" defaultValue={student.position ?? ""} />
                <Field label="Número da camisa" name="shirtNumber" defaultValue={student.shirtNumber ?? ""} />
                <SelectField
                  label="Pé dominante"
                  name="dominantFoot"
                  defaultValue={student.dominantFoot ?? ""}
                  options={[
                    ["", "Selecionar"],
                    ["DESTRO", "Destro"],
                    ["CANHOTO", "Canhoto"],
                    ["AMBIDESTRO", "Ambidestro"],
                  ]}
                />
              </div>
              <input type="hidden" name="_weekdaysPresent" value="true" />
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {weekdays.map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 rounded-lg border border-neutral-800 p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="weekdays"
                      value={value}
                      defaultChecked={student.weekdays.includes(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </Section>
          )}
          {activeTab === "familia" && (
            <Section title="Família e responsável">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome do responsável" name="guardianName" defaultValue={student.guardianName} required />
                <SelectField
                  label="Parentesco"
                  name="guardianRelation"
                  defaultValue={student.guardianRelation}
                  options={[
                    ["MAE", "Mãe"],
                    ["PAI", "Pai"],
                    ["AVO", "Avó / avô"],
                    ["TIO", "Tio(a)"],
                    ["IRMAO", "Irmão(ã)"],
                    ["TUTOR", "Tutor(a)"],
                    ["OUTRO", "Outro"],
                  ]}
                />
                <Field
                  label="Telefone do responsável"
                  name="guardianPhone"
                  defaultValue={student.guardianPhone ?? ""}
                />
                <Field
                  label="E-mail do responsável"
                  name="guardianEmail"
                  type="email"
                  defaultValue={student.guardianEmail ?? ""}
                />
                <Field label="CPF do responsável" name="guardianCpf" defaultValue={student.guardianCpf ?? ""} />
                {student.vinculo === "PROJETO_SOCIAL" && (
                  <Field
                    label="Pessoas na residência"
                    name="householdSize"
                    type="number"
                    defaultValue={student.householdSize ?? ""}
                  />
                )}
                <Field label="Nome da mãe" name="motherName" defaultValue={student.motherName ?? ""} />
                <Field label="Profissão da mãe" name="motherJob" defaultValue={student.motherJob ?? ""} />
                <Field label="Telefone da mãe" name="motherPhone" defaultValue={student.motherPhone ?? ""} />
                <Field label="Nome do pai" name="fatherName" defaultValue={student.fatherName ?? ""} />
                <Field label="Profissão do pai" name="fatherJob" defaultValue={student.fatherJob ?? ""} />
                <Field label="Telefone do pai" name="fatherPhone" defaultValue={student.fatherPhone ?? ""} />
                <Field label="Outro responsável" name="otherGuardian" defaultValue={student.otherGuardian ?? ""} />
              </div>
            </Section>
          )}
          {activeTab === "saude" && (
            <Section title="Saúde, dificuldades e emergência">
              <input type="hidden" name="_difficultiesPresent" value="true" />
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Convênio médico"
                  name="hasHealthPlan"
                  defaultValue={student.hasHealthPlan == null ? "" : String(student.hasHealthPlan)}
                  options={[
                    ["", "Selecione"],
                    ["true", "Sim"],
                    ["false", "Não"],
                  ]}
                />
                <Field label="Tipo sanguíneo" name="bloodType" defaultValue={student.bloodType ?? ""} />
                <Field label="Doença crônica" name="chronicDisease" defaultValue={student.chronicDisease ?? ""} />
                <Field
                  label="Medicação contínua"
                  name="continuousMedication"
                  defaultValue={student.continuousMedication ?? ""}
                />
                <Field label="Alergias" name="allergies" defaultValue={student.allergies ?? ""} />
                <Field
                  label="Restrições alimentares"
                  name="foodRestrictions"
                  defaultValue={student.foodRestrictions ?? ""}
                />
                <Field label="Cirurgias" name="surgeries" defaultValue={student.surgeries ?? ""} />
                <SelectField
                  label="Acompanhamento psicológico"
                  name="psychFollowUp"
                  defaultValue={String(student.psychFollowUp)}
                  options={[
                    ["false", "Não"],
                    ["true", "Sim"],
                  ]}
                />
                <Field label="Cartão SUS" name="susCard" defaultValue={student.susCard ?? ""} />
                <Field label="Observações médicas" name="medicalNotes" defaultValue={student.medicalNotes ?? ""} />
                <Field
                  label="Dificuldades (outras)"
                  name="difficultiesOther"
                  defaultValue={student.difficultiesOther ?? ""}
                />
                <Field label="Contato de emergência" name="emergencyName" defaultValue={student.emergencyName ?? ""} />
                <Field
                  label="Parentesco do contato"
                  name="emergencyRelation"
                  defaultValue={student.emergencyRelation ?? ""}
                />
                <Field
                  label="Telefone de emergência"
                  name="emergencyPhone"
                  defaultValue={student.emergencyPhone ?? ""}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {difficulties.map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 rounded-lg border border-neutral-800 p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="difficulties"
                      value={value}
                      defaultChecked={student.difficulties.includes(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </Section>
          )}
          {activeTab === "autorizacoes" && (
            <Section title="Autorizações e termos">
              {[
                ["authTrips", "Passeios e viagens", student.authTrips],
                ["authImage", "Uso de imagem", student.authImage],
                ["authTermsAccepted", "Aceite dos termos do projeto e LGPD", student.authTermsAccepted],
              ].map(([name, label, checked]) => (
                <label
                  key={String(name)}
                  className="flex items-center gap-3 rounded-lg border border-neutral-800 p-3 text-sm"
                >
                  <input type="hidden" name={String(name)} value="false" />
                  <input type="checkbox" name={String(name)} value="true" defaultChecked={Boolean(checked)} />
                  {String(label)}
                </label>
              ))}
            </Section>
          )}
          {activeTab === "financeiro" && canViewFinance && (
            <Section title="Cobrança e dados fiscais">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Mensalidade (R$)"
                  name="monthlyFee"
                  type="currency"
                  defaultValue={formatBrazilianCurrencyInput(student.monthlyFee)}
                />
                <Field
                  label="Dia de cobrança"
                  name="billingDay"
                  type="number"
                  defaultValue={student.billingDay ?? ""}
                />
                <Field label="Nome para nota fiscal" name="invoiceName" defaultValue={student.invoiceName ?? ""} />
                <Field label="CPF para nota fiscal" name="invoiceCpf" defaultValue={student.invoiceCpf ?? ""} />
                <Field
                  label="E-mail para nota fiscal"
                  name="invoiceEmail"
                  type="email"
                  defaultValue={student.invoiceEmail ?? ""}
                />
              </div>
            </Section>
          )}
          {activeTab === "entregas" && (
            <Section title="Uniformes e materiais">
              <label className="flex items-center gap-3 rounded-lg border border-neutral-800 p-3 text-sm">
                <input type="hidden" name="hasUniform" value="false" />
                <input type="checkbox" name="hasUniform" value="true" defaultChecked={student.hasUniform} /> Possui
                uniforme
              </label>
            </Section>
          )}
          <div className="flex justify-end">
            <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black">
              Salvar alterações
            </button>
          </div>
        </form>
      ) : (
        <>
          {activeTab === "dados" && (
            <Panel className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Matrícula" value={student.matricula} />
              <Info label="Vínculo" value={labelFor(student.vinculo)} />
              <Info label="Status" value={labelFor(student.status)} />
              <Info label="Data de nascimento" value={format(student.birthDate, "dd/MM/yyyy", { locale: ptBR })} />
              <Info
                label="Data de início"
                value={student.startDate ? format(student.startDate, "dd/MM/yyyy", { locale: ptBR }) : "—"}
              />
              <Info label="Data de matrícula" value={format(student.enrolledAt, "dd/MM/yyyy", { locale: ptBR })} />
              <Info label="Polo" value={student.polo.name} />
              <Info label="Turma" value={student.turma?.name} />
              <Info label="CPF" value={student.cpf} />
              <Info label="RG" value={student.rg} />
              <Info label="Sexo" value={student.sex} />
              <Info label="Etnia" value={student.ethnicity} />
              <Info label="Naturalidade" value={student.naturalidade} />
              <Info
                label="Endereço"
                value={[
                  student.address,
                  student.addressNumber,
                  student.neighborhood,
                  student.city,
                  student.state,
                  student.postalCode ? `CEP ${student.postalCode}` : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
              <Info label="Escola" value={student.school} />
              <Info label="Série" value={student.schoolGrade} />
              <Info label="Turno escolar" value={labelFor(student.schoolShift)} />
              <Info label="Posição" value={student.position} />
              <Info label="Número da camisa" value={student.shirtNumber} />
              <Info label="Pé dominante" value={labelFor(student.dominantFoot)} />
              <Info
                label="Dias de atividade"
                value={student.weekdays
                  .map(
                    (day) =>
                      ({ SEG: "Segunda", TER: "Terça", QUA: "Quarta", QUI: "Quinta", SEX: "Sexta", SAB: "Sábado" })[
                        day
                      ] ?? day,
                  )
                  .join(", ")}
              />
              <Info
                label="Data de desligamento"
                value={student.exitDate ? format(student.exitDate, "dd/MM/yyyy", { locale: ptBR }) : undefined}
              />
              <Info label="Motivo do desligamento" value={student.exitReason} />
              <Info label="Criado em" value={format(student.createdAt, "dd/MM/yyyy", { locale: ptBR })} />
            </Panel>
          )}
          {activeTab === "familia" && (
            <Panel className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Responsável" value={student.guardianName} />
              <Info label="Parentesco" value={labelFor(student.guardianRelation)} />
              <Info label="Telefone" value={student.guardianPhone} />
              <Info label="E-mail" value={student.guardianEmail} />
              <Info label="CPF" value={student.guardianCpf} />
              {student.vinculo === "PROJETO_SOCIAL" && (
                <Info label="Pessoas na residência" value={student.householdSize} />
              )}
              <Info label="Mãe" value={student.motherName} />
              <Info label="Profissão da mãe" value={student.motherJob} />
              <Info label="Telefone da mãe" value={student.motherPhone} />
              <Info label="Pai" value={student.fatherName} />
              <Info label="Profissão do pai" value={student.fatherJob} />
              <Info label="Telefone do pai" value={student.fatherPhone} />
              <Info label="Outro responsável" value={student.otherGuardian} />
            </Panel>
          )}
          {activeTab === "saude" && (
            <Panel className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <Info
                label="Convênio médico"
                value={student.hasHealthPlan == null ? "—" : student.hasHealthPlan ? "Sim" : "Não"}
              />
              <Info label="Tipo sanguíneo" value={student.bloodType} />
              <Info label="Doença crônica" value={student.chronicDisease} />
              <Info label="Medicação contínua" value={student.continuousMedication} />
              <Info label="Alergias" value={student.allergies} />
              <Info label="Restrições alimentares" value={student.foodRestrictions} />
              <Info label="Cirurgias" value={student.surgeries} />
              <Info label="Acompanhamento psicológico" value={student.psychFollowUp ? "Sim" : "Não"} />
              <Info label="Dificuldades" value={student.difficulties.map(labelFor).join(", ")} />
              <Info label="Outras dificuldades" value={student.difficultiesOther} />
              <Info label="Cartão SUS" value={student.susCard} />
              <Info label="Observações médicas" value={student.medicalNotes} />
              <Info label="Contato de emergência" value={student.emergencyName} />
              <Info label="Parentesco" value={student.emergencyRelation} />
              <Info label="Telefone de emergência" value={student.emergencyPhone} />
            </Panel>
          )}
          {activeTab === "autorizacoes" && (
            <Panel className="space-y-3 p-5">
              <Info label="Passeios e viagens" value={student.authTrips ? "Autorizado" : "Não autorizado"} />
              <Info label="Uso de imagem" value={student.authImage ? "Autorizado" : "Não autorizado"} />
              <Info label="Termos do projeto e LGPD" value={student.authTermsAccepted ? "Aceito" : "Pendente"} />
            </Panel>
          )}
          {activeTab === "documentos" && (
            <DataTable headers={["Documento", "Status", "Arquivo", "Observações"]} count={student.documents.length}>
              {student.documents.length ? (
                student.documents.map((document) => (
                  <tr key={document.id}>
                    <td className="px-4 py-3">{labelFor(document.type)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={
                          document.status === "APROVADO" ? "green" : document.status === "REJEITADO" ? "red" : "amber"
                        }
                      >
                        {labelFor(document.status)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      {document.filePath ? (
                        <Link className="text-emerald-400" href={`/api/documentos/${document.id}/download`}>
                          {document.fileName}
                        </Link>
                      ) : (
                        "Não enviado"
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{document.notes ?? "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <EmptyState text="Nenhum documento cadastrado." />
                  </td>
                </tr>
              )}
            </DataTable>
          )}
          {activeTab === "frequencia" && (
            <Panel className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Frequência</h2>
                  <p className="text-sm text-neutral-400">{absences.length} falta(s) não justificada(s)</p>
                </div>
                {attendanceRisk && <StatusBadge tone="red">Alerta: 3 ou mais faltas</StatusBadge>}
              </div>
              {student.attendanceRecords.length ? (
                <div className="divide-y divide-neutral-800">
                  {student.attendanceRecords.map((record) => (
                    <div key={record.id} className="flex justify-between py-3 text-sm">
                      <span>{format(record.session.date, "dd/MM/yyyy", { locale: ptBR })}</span>
                      <StatusBadge
                        tone={record.status === "PRESENTE" ? "green" : record.status === "FALTA" ? "red" : "amber"}
                      >
                        {labelFor(record.status)}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="Nenhuma frequência registrada." />
              )}
            </Panel>
          )}
          {activeTab === "financeiro" && canViewFinance && (
            <div className="space-y-4">
              <Panel className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Mensalidade" value={formatBrazilianCurrency(student.monthlyFee)} />
                <Info label="Dia de cobrança" value={student.billingDay} />
                <Info label="Nome para nota" value={student.invoiceName} />
                <Info label="CPF para nota" value={student.invoiceCpf} />
                <Info label="E-mail para nota" value={student.invoiceEmail} />
              </Panel>
              <DataTable headers={["Vencimento", "Valor", "Status"]} count={student.invoices.length}>
                {student.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-3">{format(invoice.dueDate, "dd/MM/yyyy", { locale: ptBR })}</td>
                    <td className="px-4 py-3">{formatBrazilianCurrency(invoice.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={invoice.status === "PAGO" ? "green" : invoice.status === "PENDENTE" ? "amber" : "neutral"}
                      >
                        {labelFor(invoice.status)}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </DataTable>
            </div>
          )}
          {activeTab === "entregas" && (
            <Panel className="p-5">
              <h2 className="text-lg font-semibold">Entregas</h2>
              <p className="mt-2 text-sm text-neutral-400">Histórico de uniformes e materiais vinculados ao aluno.</p>
              {student.stockMovements.length > 0 &&
                student.stockMovements.map((movement) => (
                  <div key={movement.id} className="flex justify-between border-b border-neutral-800 py-3 text-sm">
                    <span>
                      {labelFor(movement.type)} · {movement.item.name} ·{" "}
                      {format(movement.date, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <span>{movement.quantity}</span>
                  </div>
                ))}
            </Panel>
          )}
        </>
      )}
    </>
  );
}
