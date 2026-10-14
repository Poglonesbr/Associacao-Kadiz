"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseBrazilianDate } from "@/lib/dates";
import { requirePermission } from "@/lib/guards";
import { canAccessTurma } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function saveAttendance(form: FormData) {
  const user = await requirePermission("attendance");
  const turmaId = z.string().min(1).parse(value(form, "turmaId"));
  const turma = await prisma.turma.findUnique({ where: { id: turmaId }, select: { professorId: true } });
  if (!turma || !canAccessTurma(user, turma.professorId)) throw new Error("Acesso não autorizado para esta turma.");
  const date = parseBrazilianDate(value(form, "date"));
  if (!date) throw new Error("Data inválida.");
  const records = z
    .array(z.object({ alunoId: z.string(), status: z.enum(["PRESENTE", "FALTA", "FALTA_JUSTIFICADA"]) }))
    .parse(JSON.parse(value(form, "records")));
  const sessionDate = new Date(`${date}T12:00:00`);
  await prisma.attendanceSession.upsert({
    where: { turmaId_date: { turmaId, date: sessionDate } },
    create: { turmaId, date: sessionDate, takenById: user.id, records: { create: records } },
    update: { takenById: user.id, records: { deleteMany: {}, create: records } },
  });
  revalidatePath("/chamada");
}
