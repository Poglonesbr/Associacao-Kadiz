"use server";

import { DocumentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function updateDocument(form: FormData) {
  const user = await requirePermission("documents");
  const id = value(form, "id");
  const status = z.nativeEnum(DocumentStatus).parse(value(form, "status"));
  await prisma.studentDocument.update({
    where: { id },
    data: { status, reviewedById: user.id, deliveredAt: status === "ENTREGUE" ? new Date() : undefined },
  });
  revalidatePath("/documentos");
}
