"use server";

import {
  AccessAction,
  AtendidoExitType,
  AtendidoOrigin,
  AtendidoStatus,
  HousingType,
  PiaAreaStatus,
  PiaAreaType,
  PiaGoalEvaluation,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAccess } from "@/lib/audit";
import { parseBrazilianDate } from "@/lib/dates";
import { requireTecnico } from "@/lib/guards";
import { getTechnicalAreas } from "@/lib/permissions";
import { isAtendidoEligible } from "@/lib/technical-access";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (input: string) => input || null;
const areaSchema = z.array(
  z.object({
    area: z.nativeEnum(PiaAreaType),
    necessidade: z.string().nullable(),
    acoes: z.string().nullable(),
    prazoResponsavel: z.string().nullable(),
    status: z.nativeEnum(PiaAreaStatus),
  }),
);
const goalSchema = z.array(
  z.object({
    objetivo: z.string(),
    meta: z.string().nullable(),
    acoes: z.string().nullable(),
    prazo: z.string().nullable(),
    avaliacao: z.nativeEnum(PiaGoalEvaluation),
  }),
);

async function getAtendidoForEdit(id: string) {
  const record = await prisma.atendido.findUnique({ where: { id }, include: { aluno: { select: { vinculo: true } } } });
  if (!record) throw new Error("Atendido não encontrado.");
  if (!isAtendidoEligible(record.aluno.vinculo))
    throw new Error("Somente alunos do Projeto Social podem ter acompanhamento técnico.");
  return record;
}

export async function createAtendido(form: FormData) {
  const user = await requireTecnico();
  const alunoId = z.string().min(1).parse(value(form, "alunoId"));
  const aluno = await prisma.aluno.findUnique({ where: { id: alunoId }, select: { id: true, vinculo: true } });
  if (!aluno || !isAtendidoEligible(aluno.vinculo)) {
    throw new Error("Somente alunos do Projeto Social podem ter acompanhamento técnico.");
  }
  const existing = await prisma.atendido.findUnique({ where: { alunoId } });
  if (existing) throw new Error("Este aluno já possui registro técnico.");
  const ingressoDate = parseBrazilianDate(value(form, "ingressoDate"));
  if (!ingressoDate) throw new Error("Informe uma data de ingresso válida.");
  const atendido = await prisma.atendido.create({
    data: {
      alunoId,
      ingressoDate: new Date(`${ingressoDate}T12:00:00`),
      origem: value(form, "origem") ? z.nativeEnum(AtendidoOrigin).parse(value(form, "origem")) : null,
      responsavelTecnicoId: user.id,
      createdById: user.id,
      areas: { create: Object.values(PiaAreaType).map((area) => ({ area })) },
      changes: { create: { userId: user.id, section: "Cadastro", field: "ingressoDate", newValue: ingressoDate } },
    },
  });
  await logAccess({
    userId: user.id,
    action: AccessAction.CREATE,
    resource: "Atendido",
    resourceId: atendido.id,
    alunoId,
  });
  revalidatePath("/atendidos");
  revalidatePath("/servico-social/atendidos");
  revalidatePath("/psicologia/atendidos");
  revalidatePath(`/alunos/${alunoId}`);
}

export async function updateAtendido(form: FormData) {
  const user = await requireTecnico();
  const id = z.string().min(1).parse(value(form, "id"));
  const current = await getAtendidoForEdit(id);
  const ingressoDateInput = value(form, "ingressoDate");
  const ingressoDate = parseBrazilianDate(ingressoDateInput);
  if (!ingressoDate) throw new Error("Informe uma data de ingresso válida.");
  const reviewDateInput = value(form, "nextReviewDate");
  const nextReviewDate = reviewDateInput ? parseBrazilianDate(reviewDateInput) : null;
  if (reviewDateInput && !nextReviewDate) throw new Error("Data de reavaliação inválida.");
  const familyIncomeInput = value(form, "familyIncome").replace(",", ".");
  const familyIncome = familyIncomeInput ? z.coerce.number().min(0).parse(familyIncomeInput) : null;
  const responsibleId = optional(value(form, "responsavelTecnicoId"));
  if (responsibleId) {
    const responsible = await prisma.user.findUnique({
      where: { id: responsibleId },
      select: { id: true, role: true, accessPsicologia: true, accessServicoSocial: true },
    });
    if (!responsible || getTechnicalAreas(responsible).length === 0)
      throw new Error("O responsável deve pertencer à equipe técnica.");
  }
  const areas = areaSchema.parse(JSON.parse(value(form, "areas") || "[]"));
  const goals = goalSchema
    .parse(JSON.parse(value(form, "goals") || "[]"))
    .filter((goal) => goal.objetivo.trim())
    .map((goal, order) => {
      const prazo = goal.prazo ? parseBrazilianDate(goal.prazo) : null;
      if (goal.prazo && !prazo) throw new Error("Informe uma data válida para o prazo do objetivo.");
      return {
        objetivo: goal.objetivo.trim(),
        meta: optional(goal.meta ?? ""),
        acoes: optional(goal.acoes ?? ""),
        prazo: prazo ? new Date(`${prazo}T12:00:00`) : null,
        avaliacao: goal.avaliacao,
        order,
      };
    });
  const data = {
    ingressoDate: new Date(`${ingressoDate}T12:00:00`),
    origem: value(form, "origem") ? z.nativeEnum(AtendidoOrigin).parse(value(form, "origem")) : null,
    responsavelTecnicoId: responsibleId,
    nextReviewDate: nextReviewDate ? new Date(`${nextReviewDate}T12:00:00`) : null,
    familyIncome,
    incomeSources: optional(value(form, "incomeSources")),
    nis: optional(value(form, "nis")),
    bolsaFamilia: form.get("bolsaFamilia") === "true",
    otherBenefits: optional(value(form, "otherBenefits")),
    crasReference: optional(value(form, "crasReference")),
    conselhoTutelar: form.get("conselhoTutelar") === "true",
    conselhoTutelarNotes: optional(value(form, "conselhoTutelarNotes")),
    housingType: value(form, "housingType") ? z.nativeEnum(HousingType).parse(value(form, "housingType")) : null,
    housingNotes: optional(value(form, "housingNotes")),
    vulnerabilities: form.getAll("vulnerabilities").map(String),
    currentSituation: optional(value(form, "currentSituation")),
    familyHistory: optional(value(form, "familyHistory")),
    potentialities: optional(value(form, "potentialities")),
  };
  const trackedFields = [
    "currentSituation",
    "familyHistory",
    "potentialities",
    "incomeSources",
    "otherBenefits",
  ] as const;
  const changes: {
    userId: string;
    section: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }[] = trackedFields
    .filter((field) => value(form, field) !== (current[field] ?? ""))
    .map((field) => ({
      userId: user.id,
      section:
        field === "currentSituation" || field === "familyHistory" || field === "potentialities"
          ? "Família e situação"
          : "Socioeconômico",
      field,
      oldValue: String(current[field] ?? ""),
      newValue: value(form, field),
    }));
  const currentIngreso = current.ingressoDate.toISOString().slice(0, 10);
  if (ingressoDate !== currentIngreso) {
    changes.push({
      userId: user.id,
      section: "Acompanhamento",
      field: "ingressoDate",
      oldValue: currentIngreso,
      newValue: ingressoDate,
    });
  }
  changes.push({
    userId: user.id,
    section: "Ficha do Atendido",
    field: "Salvar ficha",
    oldValue: null,
    newValue: new Date().toISOString(),
  });
  await prisma.$transaction(async (tx) => {
    await tx.atendido.update({ where: { id }, data });
    for (const area of areas) {
      await tx.piaArea.upsert({
        where: { atendidoId_area: { atendidoId: id, area: area.area } },
        create: { atendidoId: id, ...area },
        update: area,
      });
    }
    await tx.piaGoal.deleteMany({ where: { atendidoId: id } });
    if (goals.length) await tx.piaGoal.createMany({ data: goals.map((goal) => ({ ...goal, atendidoId: id })) });
    if (changes.length)
      await tx.atendidoChange.createMany({ data: changes.map((change) => ({ ...change, atendidoId: id })) });
  });
  await logAccess({
    userId: user.id,
    action: AccessAction.UPDATE,
    resource: "Atendido",
    resourceId: id,
    alunoId: current.alunoId,
  });
  revalidatePath(`/atendidos/${id}`);
  revalidatePath("/atendidos");
}

export async function setAtendidoStatus(form: FormData) {
  const user = await requireTecnico();
  const id = z.string().min(1).parse(value(form, "id"));
  const current = await getAtendidoForEdit(id);
  const status = z.nativeEnum(AtendidoStatus).parse(value(form, "status"));
  const closeType = status === "ENCERRADO" ? z.nativeEnum(AtendidoExitType).parse(value(form, "closeType")) : null;
  const closeReason = status === "ENCERRADO" ? z.string().min(3).parse(value(form, "closeReason")) : null;
  const closeDateInput = value(form, "closeDate");
  const closeDate = status === "ENCERRADO" ? parseBrazilianDate(closeDateInput) : null;
  if (status === "ENCERRADO" && closeDateInput && !closeDate) throw new Error("Data de encerramento inválida.");
  await prisma.atendido.update({
    where: { id },
    data: {
      status,
      closeType,
      closeReason,
      closeDate: closeDate ? new Date(`${closeDate}T12:00:00`) : status === "ENCERRADO" ? new Date() : null,
    },
  });
  await prisma.atendidoChange.create({
    data: {
      atendidoId: id,
      userId: user.id,
      section: "Acompanhamento",
      field: "status",
      oldValue: current.status,
      newValue: status,
    },
  });
  await logAccess({
    userId: user.id,
    action: AccessAction.UPDATE,
    resource: "Atendido",
    resourceId: id,
    alunoId: current.alunoId,
  });
  revalidatePath(`/atendidos/${id}`);
  revalidatePath("/atendidos");
}
