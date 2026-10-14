"use server";

import { AccessAction, SignatureSignerType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAccess } from "@/lib/audit";
import { parseBrazilianDate } from "@/lib/dates";
import { requireTecnico } from "@/lib/guards";
import { isAtendidoEligible } from "@/lib/technical-access";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

async function getAtendido(id: string) {
  const record = await prisma.atendido.findUnique({ where: { id }, include: { aluno: { select: { vinculo: true } } } });
  if (!record || !isAtendidoEligible(record.aluno.vinculo)) throw new Error("Atendido não encontrado.");
  return record;
}

export async function createPiaReview(form: FormData) {
  const user = await requireTecnico();
  const atendidoId = z.string().min(1).parse(value(form, "atendidoId"));
  const attended = await getAtendido(atendidoId);
  const date = parseBrazilianDate(value(form, "date"));
  const nextReviewDate = parseBrazilianDate(value(form, "nextReviewDate"));
  const changes = z.string().min(3).parse(value(form, "changes"));
  if (!date || !nextReviewDate) throw new Error("Informe datas válidas.");
  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.piaReview.create({
      data: {
        atendidoId,
        date: new Date(`${date}T12:00:00`),
        changes,
        newGoals: value(form, "newGoals") || null,
        responsavel: value(form, "responsavel") || null,
        authorId: user.id,
      },
    });
    await tx.atendido.update({
      where: { id: atendidoId },
      data: { nextReviewDate: new Date(`${nextReviewDate}T12:00:00`) },
    });
    await tx.atendidoChange.create({
      data: {
        atendidoId,
        userId: user.id,
        section: "Reavaliação",
        field: "nextReviewDate",
        oldValue: attended.nextReviewDate?.toISOString() ?? "",
        newValue: nextReviewDate,
      },
    });
    return created;
  });
  await logAccess({
    userId: user.id,
    action: AccessAction.CREATE,
    resource: "PiaReview",
    resourceId: review.id,
    alunoId: attended.alunoId,
  });
  await logAccess({
    userId: user.id,
    action: AccessAction.UPDATE,
    resource: "Atendido",
    resourceId: atendidoId,
    alunoId: attended.alunoId,
  });
  revalidatePath(`/atendidos/${atendidoId}`);
}

export async function createPiaSignature(form: FormData) {
  const user = await requireTecnico();
  const atendidoId = z.string().min(1).parse(value(form, "atendidoId"));
  const attended = await getAtendido(atendidoId);
  const imageDataUrl = z
    .string()
    .max(500_000)
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, "Assinatura inválida.")
    .parse(value(form, "imageDataUrl"));
  const signature = await prisma.piaSignature.create({
    data: {
      atendidoId,
      signerType: z.nativeEnum(SignatureSignerType).parse(value(form, "signerType")),
      signerName: z.string().min(2).parse(value(form, "signerName")),
      imageDataUrl,
      userId: user.id,
    },
  });
  await prisma.atendidoChange.create({
    data: {
      atendidoId,
      userId: user.id,
      section: "Assinaturas",
      field: `Assinatura · ${signature.signerType}`,
      newValue: signature.signerName,
    },
  });
  await logAccess({
    userId: user.id,
    action: AccessAction.CREATE,
    resource: "PiaSignature",
    resourceId: signature.id,
    alunoId: attended.alunoId,
  });
  revalidatePath(`/atendidos/${atendidoId}`);
}
