import { AccessAction, AtendidoExitType, AtendidoStatus, Area, ReferralDestination } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createEncaminhamento } from "@/app/actions/encaminhamentos";
import { createEvolucao } from "@/app/actions/evolucoes";
import { setAtendidoStatus } from "@/app/actions/atendidos";
import { createPiaReview } from "@/app/actions/pia";
import { AtendidoEditor } from "@/components/atendido-editor";
import { DateInput } from "@/components/date-input";
import { SignaturePad } from "@/components/signature-pad";
import { Button, DataTable, Field, PageHeader, Panel, SelectField, StatusBadge } from "@/components/ui";
import { formatBrazilianDate } from "@/lib/dates";
import { labelFor } from "@/lib/labels";
import { requireTecnico } from "@/lib/guards";
import { getTechnicalAreas, isTecnico } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isAtendidoEligible } from "@/lib/technical-access";
import { logAccess } from "@/lib/audit";

export default async function AtendidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireTecnico();
  const allowedAreas = getTechnicalAreas(user);
  if (!isTecnico(user)) redirect("/403");
  const record = await prisma.atendido.findUnique({
    where: { id },
    include: {
      aluno: { include: { polo: true, turma: true } },
      areas: { orderBy: { area: "asc" } },
      goals: { orderBy: { order: "asc" } },
      encaminhamentos: { orderBy: { date: "desc" } },
      evolucoes: {
        where: { area: { in: allowedAreas as Area[] } },
        include: { author: { select: { name: true } } },
        orderBy: { date: "desc" },
      },
      reviews: { include: { author: { select: { name: true } } }, orderBy: { date: "desc" } },
      signatures: {
        include: { user: { select: { professionalRegistry: true } } },
        orderBy: { signedAt: "desc" },
      },
      changes: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      pdfCopies: { orderBy: { createdAt: "desc" } },
      responsavelTecnico: { select: { name: true, professionalRegistry: true } },
    },
  });
  if (!record || !isAtendidoEligible(record.aluno.vinculo)) redirect("/403");
  await logAccess({
    userId: user.id,
    action: AccessAction.VIEW,
    resource: "Atendido",
    resourceId: record.id,
    alunoId: record.alunoId,
  });
  if (record.evolucoes.length) {
    await prisma.accessLog.createMany({
      data: record.evolucoes.map((evolution) => ({
        userId: user.id,
        action: AccessAction.VIEW,
        resource: "Evolucao",
        resourceId: evolution.id,
        alunoId: record.alunoId,
      })),
    });
  }
  const technicalUsers = await prisma.user.findMany({
    where: {
      OR: [
        { accessPsicologia: true },
        { accessServicoSocial: true },
        { role: { in: ["PSICOLOGO", "ASSISTENTE_SOCIAL"] } },
      ],
    },
    select: { id: true, name: true, jobTitle: true },
    orderBy: { name: "asc" },
  });
  const student = record.aluno;

  return (
    <>
      <PageHeader eyebrow="Ficha técnica · Projeto Social" title={student.fullName} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 text-sm text-neutral-400">
          <span>{student.polo.name}</span>
          {student.turma && <span>· {student.turma.name}</span>}
          {record.responsavelTecnico?.name && (
            <span>
              · Técnico responsável: {record.responsavelTecnico.name}
              {record.responsavelTecnico.professionalRegistry
                ? ` · ${record.responsavelTecnico.professionalRegistry}`
                : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={record.status === "ATIVO" ? "green" : "neutral"}>{labelFor(record.status)}</StatusBadge>
          <Link
            className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
            href={`/api/atendidos/${record.id}/pia`}
          >
            Gerar PDF do PIA
          </Link>
        </div>
      </div>

      {record.status === AtendidoStatus.ATIVO ? (
        <Panel className="mb-5 p-4">
          <form action={setAtendidoStatus} className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
            <input type="hidden" name="id" value={record.id} />
            <input type="hidden" name="status" value="ENCERRADO" />
            <SelectField
              label="Tipo de saída"
              name="closeType"
              options={Object.values(AtendidoExitType).map((type) => [type, labelFor(type)] as [string, string])}
            />
            <DateInput label="Data de encerramento" name="closeDate" required />
            <Field label="Justificativa / motivo" name="closeReason" required />
            <Button variant="danger">Encerrar acompanhamento</Button>
          </form>
        </Panel>
      ) : (
        <Panel className="mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-neutral-300">
            Acompanhamento encerrado em {formatBrazilianDate(record.closeDate)} · {labelFor(record.closeType)}.
          </p>
          <form action={setAtendidoStatus}>
            <input type="hidden" name="id" value={record.id} />
            <input type="hidden" name="status" value="ATIVO" />
            <Button variant="secondary">Reabrir acompanhamento</Button>
          </form>
        </Panel>
      )}

      <AtendidoEditor
        record={{
          id: record.id,
          ingressoDate: record.ingressoDate,
          origem: record.origem,
          responsavelTecnicoId: record.responsavelTecnicoId,
          nextReviewDate: record.nextReviewDate,
          familyIncome: record.familyIncome?.toString() ?? null,
          incomeSources: record.incomeSources,
          nis: record.nis,
          bolsaFamilia: record.bolsaFamilia,
          otherBenefits: record.otherBenefits,
          crasReference: record.crasReference,
          conselhoTutelar: record.conselhoTutelar,
          conselhoTutelarNotes: record.conselhoTutelarNotes,
          housingType: record.housingType,
          housingNotes: record.housingNotes,
          vulnerabilities: record.vulnerabilities,
          currentSituation: record.currentSituation,
          familyHistory: record.familyHistory,
          potentialities: record.potentialities,
        }}
        student={{
          id: student.id,
          fullName: student.fullName,
          birthDate: student.birthDate,
          matricula: student.matricula,
          polo: student.polo,
          turma: student.turma,
          guardianName: student.guardianName,
          guardianPhone: student.guardianPhone,
          guardianEmail: student.guardianEmail,
          motherName: student.motherName,
          fatherName: student.fatherName,
          address: student.address,
          addressNumber: student.addressNumber,
          neighborhood: student.neighborhood,
          city: student.city,
          state: student.state,
          postalCode: student.postalCode,
          school: student.school,
          schoolGrade: student.schoolGrade,
          schoolShift: student.schoolShift,
          householdSize: student.householdSize,
        }}
        areas={record.areas.map((area) => ({
          area: area.area,
          necessidade: area.necessidade,
          acoes: area.acoes,
          prazoResponsavel: area.prazoResponsavel,
          status: area.status,
        }))}
        goals={record.goals.map((goal) => ({
          objetivo: goal.objetivo,
          meta: goal.meta,
          acoes: goal.acoes,
          prazo: goal.prazo?.toISOString() ?? null,
          avaliacao: goal.avaliacao,
        }))}
        technicalUsers={technicalUsers}
      />

      <Panel className="mt-5 p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">5 · Encaminhamentos</h2>
        <form action={createEncaminhamento} className="mb-5 grid gap-3 border-b border-neutral-800 pb-5 md:grid-cols-3">
          <input type="hidden" name="atendidoId" value={record.id} />
          <SelectField
            label="Área"
            name="area"
            options={allowedAreas.map((area) => [area, labelFor(area)] as [string, string])}
          />
          <SelectField
            label="Destino"
            name="destination"
            options={Object.values(ReferralDestination).map(
              (destination) => [destination, labelFor(destination)] as [string, string],
            )}
          />
          <Field label="Órgão / serviço" name="destinationDetail" />
          <Field label="Motivo" name="reason" required />
          <DateInput label="Data" name="date" required />
          <div className="md:col-span-3">
            <Button>Novo encaminhamento</Button>
          </div>
        </form>
        <DataTable
          headers={["Data", "Área", "Destino", "Motivo", "Retorno", "Status"]}
          count={record.encaminhamentos.length}
          footer={false}
        >
          {record.encaminhamentos.map((referral) => (
            <tr className="text-neutral-300" key={referral.id}>
              <td className="px-4 py-3">{formatBrazilianDate(referral.date)}</td>
              <td className="px-4 py-3">{labelFor(referral.area)}</td>
              <td className="px-4 py-3">
                {labelFor(referral.destination)}
                {referral.destinationDetail ? ` · ${referral.destinationDetail}` : ""}
              </td>
              <td className="px-4 py-3">{referral.reason}</td>
              <td className="px-4 py-3">{referral.returnNotes ?? "Aguardando retorno"}</td>
              <td className="px-4 py-3">
                <StatusBadge>{labelFor(referral.status)}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel className="mt-5 p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">6 · Evoluções e acompanhamento</h2>
        <form action={createEvolucao} className="mb-5 grid gap-3 border-b border-neutral-800 pb-5 md:grid-cols-3">
          <input type="hidden" name="atendidoId" value={record.id} />
          <SelectField
            label="Área"
            name="area"
            options={allowedAreas.map((area) => [area, labelFor(area)] as [string, string])}
          />
          <DateInput label="Data da evolução" name="date" required />
          <DateInput label="Próxima reavaliação" name="nextReviewDate" />
          <label className="space-y-1.5 text-sm text-neutral-300 md:col-span-3">
            Registro / observações
            <textarea
              name="content"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"
              rows={4}
              required
              minLength={3}
            />
          </label>
          <Field label="Novas metas / combinações" name="newGoals" className="md:col-span-3" />
          <div className="md:col-span-3">
            <Button>Registrar evolução</Button>
          </div>
        </form>
        <div className="space-y-3">
          {record.evolucoes.map((evolution) => (
            <article className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-4" key={evolution.id}>
              <div className="flex flex-wrap justify-between gap-2 text-xs text-neutral-500">
                <span>
                  {formatBrazilianDate(evolution.date)} · {labelFor(evolution.area)} ·{" "}
                  {evolution.author.name ?? "Equipe técnica"}
                </span>
                <StatusBadge>{labelFor(evolution.area)}</StatusBadge>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-200">{evolution.content}</p>
              {evolution.newGoals && <p className="mt-2 text-sm text-emerald-200">Novas metas: {evolution.newGoals}</p>}
            </article>
          ))}
          {!record.evolucoes.length && (
            <p className="text-sm text-neutral-500">Ainda não há evoluções na sua área de acesso.</p>
          )}
        </div>
      </Panel>

      <Panel className="mt-5 p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">7 · Assinaturas</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <SignaturePad
            atendidoId={record.id}
            signerType="USUARIO"
            title="Atendido / responsável"
            defaultName={student.guardianName}
          />
          <SignaturePad
            atendidoId={record.id}
            signerType="PROFISSIONAL"
            title="Profissional responsável"
            defaultName={user.name ?? ""}
          />
        </div>
        {record.signatures.length > 0 && (
          <div className="mt-5 grid gap-4 border-t border-neutral-800 pt-5 md:grid-cols-2">
            {record.signatures.map((signature) => (
              <div className="rounded-lg bg-neutral-950 p-3" key={signature.id}>
                <p className="text-sm text-neutral-300">
                  {signature.signerName}
                  {signature.user?.professionalRegistry ? ` · ${signature.user.professionalRegistry}` : ""} ·{" "}
                  {labelFor(signature.signerType)} · {formatBrazilianDate(signature.signedAt)}
                </p>
                <Image
                  className="mt-2 max-h-28 w-full object-contain"
                  src={signature.imageDataUrl}
                  alt={`Assinatura de ${signature.signerName}`}
                  width={400}
                  height={112}
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel className="mt-5 p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">8 · Reavaliações do PIA</h2>
        <form action={createPiaReview} className="mb-5 grid gap-3 border-b border-neutral-800 pb-5 md:grid-cols-3">
          <input type="hidden" name="atendidoId" value={record.id} />
          <DateInput label="Data da reavaliação" name="date" required />
          <DateInput label="Próxima reavaliação" name="nextReviewDate" required />
          <Field label="Responsável" name="responsavel" defaultValue={user.name ?? ""} />
          <label className="space-y-1.5 text-sm text-neutral-300 md:col-span-3">
            Mudanças observadas
            <textarea
              name="changes"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"
              rows={3}
              required
              minLength={3}
            />
          </label>
          <Field label="Novas metas" name="newGoals" className="md:col-span-3" />
          <div className="md:col-span-3">
            <Button>Adicionar reavaliação</Button>
          </div>
        </form>
        <div className="space-y-3">
          {record.reviews.map((review) => (
            <div className="rounded-lg border border-neutral-800 p-3" key={review.id}>
              <p className="text-sm font-medium text-white">
                {formatBrazilianDate(review.date)} · {review.responsavel ?? review.author.name}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">{review.changes}</p>
              {review.newGoals && <p className="mt-2 text-sm text-emerald-200">Novas metas: {review.newGoals}</p>}
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="mt-5 p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Histórico de alterações</h2>
        <div className="space-y-2">
          {record.changes.map((change) => (
            <div
              className="flex flex-wrap justify-between gap-2 border-b border-neutral-800 pb-2 text-sm"
              key={change.id}
            >
              <span className="text-neutral-300">
                {change.section} · {change.field}
                {change.newValue ? `: ${change.newValue}` : ""}
              </span>
              <span className="text-xs text-neutral-500">
                {change.user?.name ?? "Sistema"} · {formatBrazilianDate(change.createdAt)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-neutral-800 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-200">Cópias do PDF do PIA</h3>
          {record.pdfCopies.map((copy) => (
            <p className="text-sm text-emerald-300" key={copy.id}>
              <Link href={`/api/atendidos/${record.id}/pia?copy=${copy.id}`} target="_blank">
                PDF salvo em {formatBrazilianDate(copy.createdAt)}
              </Link>
            </p>
          ))}
          {!record.pdfCopies.length && <p className="text-sm text-neutral-500">Nenhuma cópia gerada.</p>}
        </div>
      </Panel>
    </>
  );
}
