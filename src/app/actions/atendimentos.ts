"use server";

import { AccessAction, Area, AtendimentoStatus, AtendimentoType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAccess } from "@/lib/audit";
import { isValidTime, parseBrazilianDate } from "@/lib/dates";
import { requireTecnico } from "@/lib/guards";
import { canViewTechnicalArea } from "@/lib/permissions";
import { isAtendidoEligible } from "@/lib/technical-access";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

async function getAttendees(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids));
  if (!uniqueIds.length) throw new Error("Selecione ao menos um atendido.");
  const records = await prisma.atendido.findMany({
    where: { id: { in: uniqueIds } },
    include: { aluno: { select: { vinculo: true } } },
  });
  if (records.length !== uniqueIds.length || records.some((record) => !isAtendidoEligible(record.aluno.vinculo))) {
    throw new Error("Um ou mais atendidos não foram encontrados.");
  }
  return records;
}

function parseAppointment(form: FormData) {
  const area = z.nativeEnum(Area).parse(value(form, "area"));
  const date = parseBrazilianDate(value(form, "date"));
  if (!date) throw new Error("Informe uma data válida.");
  const startTimeInput = value(form, "startTime");
  const startTime = startTimeInput ? z.string().refine(isValidTime).parse(startTimeInput) : null;
  const durationInput = value(form, "durationMin");
  const type = z.nativeEnum(AtendimentoType).parse(value(form, "type"));
  const psychologyTypes: AtendimentoType[] = [
    "INDIVIDUAL",
    "GRUPOTERAPIA",
    "FAMILIAR",
    "RODA_CONVERSA",
    "APOIO_COMPETICAO",
    "OFICINA_FAMILIAS",
  ];
  const socialTypes: AtendimentoType[] = [
    "ESCUTA_QUALIFICADA",
    "ACOLHIMENTO",
    "VISITA_DOMICILIAR",
    "ORIENTACAO_FAMILIAR",
    "ARTICULACAO_REDE",
    "OFICINA_FAMILIAS",
  ];
  if (!(area === "PSICOLOGIA" ? psychologyTypes : socialTypes).includes(type)) {
    throw new Error("O tipo de atendimento não pertence à área selecionada.");
  }
  return {
    area,
    type,
    date: new Date(`${date}T12:00:00`),
    startTime,
    durationMin: durationInput ? z.coerce.number().int().min(5).max(480).parse(durationInput) : null,
    status: z.nativeEnum(AtendimentoStatus).parse(value(form, "status")),
    summary: value(form, "summary") || null,
  };
}

export async function createAtendimento(form: FormData) {
  const user = await requireTecnico();
  const attendees = await getAttendees(form.getAll("atendidoIds").map(String));
  const data = parseAppointment(form);
  if (!canViewTechnicalArea(user, data.area)) throw new Error("Acesso restrito à área técnica.");
  const appointment = await prisma.atendimento.create({
    data: {
      ...data,
      professionalId: user.id,
      atendidos: { connect: attendees.map(({ id }) => ({ id })) },
    },
  });
  await prisma.atendidoChange.createMany({
    data: attendees.map((attended) => ({
      atendidoId: attended.id,
      userId: user.id,
      section: "Atendimentos",
      field: "Novo atendimento",
      newValue: `${data.type} · ${data.status}`,
    })),
  });
  await Promise.all(
    attendees.map((attended) =>
      logAccess({
        userId: user.id,
        action: AccessAction.CREATE,
        resource: "Atendimento",
        resourceId: appointment.id,
        alunoId: attended.alunoId,
      }),
    ),
  );
  revalidatePath("/servico-social/atendimentos");
  revalidatePath("/psicologia/atendimentos");
}

export async function updateAtendimento(form: FormData) {
  const user = await requireTecnico();
  const id = z.string().min(1).parse(value(form, "id"));
  const current = await prisma.atendimento.findUnique({ where: { id }, include: { atendidos: true } });
  if (!current) throw new Error("Atendimento não encontrado.");
  if (!canViewTechnicalArea(user, current.area)) throw new Error("Acesso restrito à área técnica.");
  const attendees = await getAttendees(form.getAll("atendidoIds").map(String));
  const data = parseAppointment(form);
  if (!canViewTechnicalArea(user, data.area)) throw new Error("Acesso restrito à área técnica.");
  await prisma.atendimento.update({
    where: { id },
    data: {
      ...data,
      atendidos: { set: attendees.map(({ id: attendedId }) => ({ id: attendedId })) },
    },
  });
  const affected = new Map([...current.atendidos, ...attendees].map((attended) => [attended.id, attended]));
  await Promise.all(
    Array.from(affected.values()).map(async ({ id: attendedId }) => {
      const attended = await prisma.atendido.findUnique({ where: { id: attendedId }, select: { alunoId: true } });
      if (!attended) return;
      await logAccess({
        userId: user.id,
        action: AccessAction.UPDATE,
        resource: "Atendimento",
        resourceId: id,
        alunoId: attended.alunoId,
      });
      await prisma.atendidoChange.create({
        data: {
          atendidoId: attendedId,
          userId: user.id,
          section: "Atendimentos",
          field: "Atualizar atendimento",
          newValue: `${data.type} · ${data.status}`,
        },
      });
    }),
  );
  revalidatePath("/servico-social/atendimentos");
  revalidatePath("/psicologia/atendimentos");
}
