"use server";

import { EventCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseBrazilianDate, isValidTime } from "@/lib/dates";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function createEvent(form: FormData) {
  await requirePermission("calendar");
  const date = parseBrazilianDate(value(form, "date"));
  if (!date) throw new Error("Informe uma data válida.");
  const start = z.string().refine(isValidTime).parse(value(form, "startTime"));
  const end = value(form, "endTime");
  await prisma.event.create({
    data: {
      title: z.string().min(2).parse(value(form, "title")),
      description: value(form, "description") || null,
      start: new Date(`${date}T${start}:00`),
      end: end && isValidTime(end) ? new Date(`${date}T${end}:00`) : null,
      allDay: value(form, "allDay") === "on",
      category: z.nativeEnum(EventCategory).parse(value(form, "category")),
      poloId: value(form, "poloId") || null,
    },
  });
  revalidatePath("/agenda");
}
