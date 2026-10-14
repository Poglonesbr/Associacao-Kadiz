"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function createTask(form: FormData) {
  const user = await requirePermission("tasks");
  const title = z.string().min(2).parse(value(form, "title"));
  await prisma.task.create({ data: { title, createdById: user.id } });
  revalidatePath("/tarefas");
}
