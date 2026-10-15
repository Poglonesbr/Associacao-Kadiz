"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (input: string) => input || null;
const quantity = z.coerce.number().int().min(0).parse;

const itemSchema = z.object({
  name: z.string().trim().min(2),
  category: z.enum(["UNIFORME", "DOACAO", "MATERIAL_ESPORTIVO", "ALIMENTO", "OUTRO"]),
  size: z.string().trim().optional(),
  unit: z.string().trim().min(1).max(20),
  initialQuantity: z.number().int().min(0),
  minQuantity: z.number().int().min(0),
  notes: z.string().trim().optional(),
});

export async function createStockItem(form: FormData) {
  const user = await requirePermission("stock");
  const data = itemSchema.parse({
    name: value(form, "name"),
    category: value(form, "category"),
    size: value(form, "size"),
    unit: value(form, "unit"),
    initialQuantity: quantity(value(form, "initialQuantity")),
    minQuantity: quantity(value(form, "minQuantity")),
    notes: value(form, "notes"),
  });

  await prisma.$transaction(async (tx) => {
    const item = await tx.stockItem.create({
      data: {
        name: data.name,
        category: data.category,
        size: optional(data.size ?? ""),
        unit: data.unit,
        quantity: data.initialQuantity,
        minQuantity: data.minQuantity,
        notes: optional(data.notes ?? ""),
      },
    });
    if (data.initialQuantity > 0) {
      await tx.stockMovement.create({
        data: {
          itemId: item.id,
          type: "ENTRADA",
          quantity: data.initialQuantity,
          reason: "Estoque inicial",
          userId: user.id,
        },
      });
    }
  });

  revalidatePath("/estoque");
}

export async function registerStockMovement(form: FormData) {
  const user = await requirePermission("stock");
  const itemId = z.string().min(1).parse(value(form, "itemId"));
  const type = z.enum(["ENTRADA", "SAIDA", "AJUSTE"]).parse(value(form, "type"));
  const amount = quantity(value(form, "quantity"));
  const alunoId = optional(value(form, "alunoId"));
  const donor = optional(value(form, "donor"));
  const reason = optional(value(form, "reason"));

  if (type === "SAIDA" && amount < 1) throw new Error("A saída deve ser maior que zero.");

  await prisma.$transaction(async (tx) => {
    const item = await tx.stockItem.findUnique({ where: { id: itemId }, select: { id: true } });
    if (!item) throw new Error("Item de estoque não encontrado.");
    if (alunoId) {
      const aluno = await tx.aluno.findUnique({ where: { id: alunoId }, select: { id: true } });
      if (!aluno) throw new Error("Aluno não encontrado.");
    }

    if (type === "ENTRADA") {
      await tx.stockItem.update({ where: { id: itemId }, data: { quantity: { increment: amount } } });
    } else if (type === "AJUSTE") {
      await tx.stockItem.update({ where: { id: itemId }, data: { quantity: amount } });
    } else {
      const updated = await tx.stockItem.updateMany({
        where: { id: itemId, quantity: { gte: amount } },
        data: { quantity: { decrement: amount } },
      });
      if (updated.count !== 1) throw new Error("A saída excede a quantidade disponível em estoque.");
    }

    await tx.stockMovement.create({
      data: { itemId, type, quantity: amount, alunoId, donor, reason, userId: user.id },
    });
  });

  revalidatePath("/estoque");
}
