"use server";

import { AccessAction, Area } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAccess } from "@/lib/audit";
import { parseBrazilianDate } from "@/lib/dates";
import { requireTecnico } from "@/lib/guards";
import { canViewTechnicalArea } from "@/lib/permissions";
import { isAtendidoEligible } from "@/lib/technical-access";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

async function getEligibleAtendido(id: string) {
  const record = await prisma.atendido.findUnique({ where: { id }, include: { aluno: { select: { vinculo: true } } } });
  if (!record) throw new Error("Atendido não encontrado.");
  if (!isAtendidoEligible(record.aluno.vinculo)) throw new Error("Vínculo inelegível para atendimento técnico.");
  return record;
}

export async function createEvolucao(form: FormData) {
  const user = await requireTecnico();
  const atendidoId = z.string().min(1).parse(value(form, "atendidoId"));
  const atendido = await getEligibleAtendido(atendidoId);
  const area = z.nativeEnum(Area).parse(value(form, "area"));
  if (!canViewTechnicalArea(user, area)) throw new Error("Acesso restrito à área técnica.");
  const date = parseBrazilianDate(value(form, "date"));
  const nextReviewDateInput = value(form, "nextReviewDate");
  const nextReviewDate = nextReviewDateInput ? parseBrazilianDate(nextReviewDateInput) : null;
  const content = z.string().min(3).parse(value(form, "content"));
  if (!date) throw new Error("Informe uma data válida.");
  if (nextReviewDateInput && !nextReviewDate) throw new Error("Data de reavaliação inválida.");
  const evolution = await prisma.evolucao.create({
    data: {
      atendidoId,
      area,
      authorId: user.id,
      date: new Date(`${date}T12:00:00`),
      content,
      newGoals: value(form, "newGoals") || null,
    },
  });
  await prisma.atendidoChange.create({
    data: {
      atendidoId,
      userId: user.id,
      section: "Evoluções",
      field: `Nova evolução · ${area}`,
      newValue: content,
    },
  });
  await logAccess({
    userId: user.id,
    action: AccessAction.CREATE,
    resource: "Evolucao",
    resourceId: evolution.id,
    alunoId: atendido.alunoId,
  });
  if (nextReviewDate) {
    await prisma.atendido.update({
      where: { id: atendidoId },
      data: { nextReviewDate: new Date(`${nextReviewDate}T12:00:00`) },
    });
    await prisma.atendidoChange.create({
      data: {
        atendidoId,
        userId: user.id,
        section: "Acompanhamento",
        field: "nextReviewDate",
        newValue: nextReviewDate,
      },
    });
    await logAccess({
      userId: user.id,
      action: AccessAction.UPDATE,
      resource: "Atendido",
      resourceId: atendidoId,
      alunoId: atendido.alunoId,
    });
  }
  revalidatePath(`/atendidos/${atendidoId}`);
  revalidatePath(`/servico-social/evolucoes`);
  revalidatePath(`/psicologia/evolucoes`);
}

export async function updateEvolucao(form: FormData) {
  const user = await requireTecnico();
  const id = z.string().min(1).parse(value(form, "id"));
  const current = await prisma.evolucao.findUnique({
    where: { id },
    include: { atendido: { select: { alunoId: true, aluno: { select: { vinculo: true } } } } },
  });
  if (!current || !isAtendidoEligible(current.atendido.aluno.vinculo)) throw new Error("Evolução não encontrada.");
  if (current.authorId !== user.id) throw new Error("Somente o autor pode editar esta evolução.");
  if (!canViewTechnicalArea(user, current.area)) throw new Error("Acesso restrito à área técnica.");
  const date = parseBrazilianDate(value(form, "date"));
  const content = z.string().min(3).parse(value(form, "content"));
  if (!date) throw new Error("Informe uma data válida.");
  await prisma.evolucao.update({
    where: { id },
    data: { date: new Date(`${date}T12:00:00`), content, newGoals: value(form, "newGoals") || null },
  });
  await prisma.atendidoChange.create({
    data: {
      atendidoId: current.atendidoId,
      userId: user.id,
      section: "Evoluções",
      field: `Editar evolução · ${current.area}`,
      oldValue: current.content,
      newValue: content,
    },
  });
  await logAccess({
    userId: user.id,
    action: AccessAction.UPDATE,
    resource: "Evolucao",
    resourceId: id,
    alunoId: current.atendido.alunoId,
  });
  revalidatePath(`/atendidos/${current.atendidoId}`);
  revalidatePath(`/servico-social/evolucoes`);
  revalidatePath(`/psicologia/evolucoes`);
}
