"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isValidTime } from "@/lib/dates";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (input: string) => input || null;

export async function createPolo(form: FormData) {
  await requirePermission("poles");
  await prisma.polo.create({
    data: {
      name: z.string().min(2).parse(value(form, "name")),
      type: z.enum(["SEDE", "ESCOLA_POLO"]).parse(value(form, "type")),
      address: optional(value(form, "address")),
    },
  });
  revalidatePath("/polos");
}

export async function updatePolo(form: FormData) {
  await requirePermission("poles");
  await prisma.polo.update({
    where: { id: value(form, "id") },
    data: {
      name: z.string().min(2).parse(value(form, "name")),
      type: z.enum(["SEDE", "ESCOLA_POLO"]).parse(value(form, "type")),
      address: optional(value(form, "address")),
      active: value(form, "active") !== "false",
    },
  });
  revalidatePath("/polos");
}

export async function createTurma(form: FormData) {
  await requirePermission("poles");
  const name = z.string().min(2).parse(value(form, "name"));
  const poloId = z.string().min(1).parse(value(form, "poloId"));
  const modality = z
    .enum(["FUTEBOL", "FUTSAL", "XADREZ", "REFORCO_ESCOLAR", "HORTA", "OUTRO"])
    .parse(value(form, "modality"));
  const shift = z.enum(["MANHA", "TARDE", "NOITE"]).parse(value(form, "shift"));
  const startTime = z
    .string()
    .refine(isValidTime, "Informe o horário no formato HH:mm.")
    .parse(value(form, "startTime"));
  const endTime = z.string().refine(isValidTime, "Informe o horário no formato HH:mm.").parse(value(form, "endTime"));
  await prisma.turma.create({
    data: {
      name,
      poloId,
      modality,
      shift,
      startTime,
      endTime,
      weekdays: form.getAll("weekdays").map(String),
      professorId: optional(value(form, "professorId")),
    },
  });
  revalidatePath("/polos");
}

export async function updateTurma(form: FormData) {
  await requirePermission("poles");
  const id = value(form, "id");
  const name = z.string().min(2).parse(value(form, "name"));
  const shift = z.enum(["MANHA", "TARDE", "NOITE"]).parse(value(form, "shift"));
  const modality = z
    .enum(["FUTEBOL", "FUTSAL", "XADREZ", "REFORCO_ESCOLAR", "HORTA", "OUTRO"])
    .parse(value(form, "modality"));
  const startTime = z
    .string()
    .refine(isValidTime, "Informe o horário no formato HH:mm.")
    .parse(value(form, "startTime"));
  const endTime = z.string().refine(isValidTime, "Informe o horário no formato HH:mm.").parse(value(form, "endTime"));
  await prisma.turma.update({
    where: { id },
    data: {
      name,
      shift,
      modality,
      startTime,
      endTime,
      weekdays: form.getAll("weekdays").map(String),
      active: value(form, "active") !== "false",
    },
  });
  revalidatePath("/polos");
}
