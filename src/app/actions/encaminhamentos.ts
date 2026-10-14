"use server";

import { AccessAction, Area, ReferralDestination, ReferralStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAccess } from "@/lib/audit";
import { parseBrazilianDate } from "@/lib/dates";
import { requireTecnico } from "@/lib/guards";
import { canViewTechnicalArea } from "@/lib/permissions";
import { labelFor } from "@/lib/labels";
import { isAtendidoEligible } from "@/lib/technical-access";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function createEncaminhamento(form: FormData) {
  const user = await requireTecnico();
  const atendidoId = z.string().min(1).parse(value(form, "atendidoId"));
  const attended = await prisma.atendido.findUnique({
    where: { id: atendidoId },
    include: { aluno: { select: { vinculo: true } } },
  });
  if (!attended || !isAtendidoEligible(attended.aluno.vinculo)) throw new Error("Atendido não encontrado.");
  const area = z.nativeEnum(Area).parse(value(form, "area"));
  if (!canViewTechnicalArea(user, area)) throw new Error("Acesso restrito à área técnica.");
  const date = parseBrazilianDate(value(form, "date"));
  const reason = z.string().min(3).parse(value(form, "reason"));
  if (!date) throw new Error("Informe uma data válida.");
  const referral = await prisma.encaminhamento.create({
    data: {
      atendidoId,
      area,
      destination: z.nativeEnum(ReferralDestination).parse(value(form, "destination")),
      destinationDetail: value(form, "destinationDetail") || null,
      reason,
      date: new Date(`${date}T12:00:00`),
      returnNotes: value(form, "returnNotes") || null,
      status: value(form, "status")
        ? z.nativeEnum(ReferralStatus).parse(value(form, "status"))
        : ReferralStatus.AGUARDANDO,
    },
  });
  await prisma.atendidoChange.create({
    data: {
      atendidoId,
      userId: user.id,
      section: "Encaminhamentos",
      field: "Novo encaminhamento",
      newValue: `${labelFor(area)} · ${labelFor(referral.destination)} · ${reason}`,
    },
  });
  await logAccess({
    userId: user.id,
    action: AccessAction.CREATE,
    resource: "Encaminhamento",
    resourceId: referral.id,
    alunoId: attended.alunoId,
  });
  revalidatePath(`/atendidos/${atendidoId}`);
  revalidatePath("/servico-social/encaminhamentos");
  revalidatePath("/psicologia/encaminhamentos");
}

export async function updateEncaminhamento(form: FormData) {
  const user = await requireTecnico();
  const id = z.string().min(1).parse(value(form, "id"));
  const current = await prisma.encaminhamento.findUnique({
    where: { id },
    include: { atendido: { select: { alunoId: true, aluno: { select: { vinculo: true } } } } },
  });
  if (!current || !isAtendidoEligible(current.atendido.aluno.vinculo))
    throw new Error("Encaminhamento não encontrado.");
  if (!canViewTechnicalArea(user, current.area)) throw new Error("Acesso restrito à área técnica.");
  const date = parseBrazilianDate(value(form, "date"));
  const reason = z.string().min(3).parse(value(form, "reason"));
  if (!date) throw new Error("Informe uma data válida.");
  await prisma.encaminhamento.update({
    where: { id },
    data: {
      destination: z.nativeEnum(ReferralDestination).parse(value(form, "destination")),
      destinationDetail: value(form, "destinationDetail") || null,
      reason,
      date: new Date(`${date}T12:00:00`),
      returnNotes: value(form, "returnNotes") || null,
      status: z.nativeEnum(ReferralStatus).parse(value(form, "status")),
    },
  });
  await prisma.atendidoChange.create({
    data: {
      atendidoId: current.atendidoId,
      userId: user.id,
      section: "Encaminhamentos",
      field: "Atualizar encaminhamento",
      oldValue: `${current.status} · ${current.returnNotes ?? ""}`,
      newValue: `${value(form, "status")} · ${value(form, "returnNotes")}`,
    },
  });
  await logAccess({
    userId: user.id,
    action: AccessAction.UPDATE,
    resource: "Encaminhamento",
    resourceId: id,
    alunoId: current.atendido.alunoId,
  });
  revalidatePath(`/atendidos/${current.atendidoId}`);
  revalidatePath("/servico-social/encaminhamentos");
  revalidatePath("/psicologia/encaminhamentos");
}

export async function updateEncaminhamentoStatus(form: FormData) {
  const user = await requireTecnico();
  const id = z.string().min(1).parse(value(form, "id"));
  const current = await prisma.encaminhamento.findUnique({
    where: { id },
    include: { atendido: { select: { alunoId: true, aluno: { select: { vinculo: true } } } } },
  });
  if (!current || !isAtendidoEligible(current.atendido.aluno.vinculo))
    throw new Error("Encaminhamento não encontrado.");
  if (!canViewTechnicalArea(user, current.area)) throw new Error("Acesso restrito à área técnica.");
  await prisma.encaminhamento.update({
    where: { id },
    data: {
      status: z.nativeEnum(ReferralStatus).parse(value(form, "status")),
      returnNotes: value(form, "returnNotes") || null,
    },
  });
  await prisma.atendidoChange.create({
    data: {
      atendidoId: current.atendidoId,
      userId: user.id,
      section: "Encaminhamentos",
      field: "Status / retorno do encaminhamento",
      oldValue: `${current.status} · ${current.returnNotes ?? ""}`,
      newValue: `${value(form, "status")} · ${value(form, "returnNotes")}`,
    },
  });
  await logAccess({
    userId: user.id,
    action: AccessAction.UPDATE,
    resource: "Encaminhamento",
    resourceId: id,
    alunoId: current.atendido.alunoId,
  });
  revalidatePath(`/atendidos/${current.atendidoId}`);
  revalidatePath("/servico-social/encaminhamentos");
  revalidatePath("/psicologia/encaminhamentos");
}
