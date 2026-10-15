"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function createObjective(form: FormData) {
  const user = await requirePermission("objectives");
  await prisma.objective.create({
    data: {
      title: z.string().min(3).parse(value(form, "title")),
      description: value(form, "description") || null,
      order: Number(value(form, "order") || 0),
      createdById: user.id,
    },
  });
  revalidatePath("/objetivos");
}

export async function updateObjective(form: FormData) {
  await requirePermission("objectives");
  await prisma.objective.update({
    where: { id: z.string().min(1).parse(value(form, "id")) },
    data: {
      title: z.string().min(3).parse(value(form, "title")),
      description: value(form, "description") || null,
      order: Number(value(form, "order") || 0),
      active: value(form, "active") === "true",
    },
  });
  revalidatePath("/objetivos");
}
