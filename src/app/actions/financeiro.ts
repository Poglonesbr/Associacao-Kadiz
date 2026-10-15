"use server";

import { FinanceType, InvoiceStatus, PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseBrazilianCurrency } from "@/lib/money";
import { parseBrazilianDate } from "@/lib/dates";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function createFinanceEntry(form: FormData) {
  const user = await requirePermission("finance");
  const amount = parseBrazilianCurrency(value(form, "amount"));
  if (amount === null || amount <= 0) throw new Error("Informe um valor válido.");
  const date = parseBrazilianDate(value(form, "date"));
  if (!date) throw new Error("Informe uma data válida.");
  await prisma.financeEntry.create({
    data: {
      type: z.nativeEnum(FinanceType).parse(value(form, "type")),
      category: z.string().min(2).parse(value(form, "category")),
      description: z.string().min(2).parse(value(form, "description")),
      amount,
      date: new Date(`${date}T12:00:00`),
      source: value(form, "source") || null,
      userId: user.id,
    },
  });
  revalidatePath("/financeiro");
  revalidatePath("/inicio");
}

export async function createInvoice(form: FormData) {
  await requirePermission("finance");
  const amount = parseBrazilianCurrency(value(form, "amount"));
  const dueDate = parseBrazilianDate(value(form, "dueDate"));
  if (amount === null || amount <= 0) throw new Error("Informe um valor válido.");
  if (!dueDate) throw new Error("Informe uma data de vencimento válida.");
  await prisma.invoice.create({
    data: {
      alunoId: z.string().min(1).parse(value(form, "alunoId")),
      referenceMonth: z.string().regex(/^\d{4}-\d{2}$/).parse(value(form, "referenceMonth")),
      amount,
      dueDate: new Date(`${dueDate}T12:00:00`),
      notes: value(form, "notes") || null,
    },
  });
  revalidatePath("/financeiro");
}

export async function updateInvoiceStatus(form: FormData) {
  await requirePermission("finance");
  const status = z.nativeEnum(InvoiceStatus).parse(value(form, "status"));
  const paymentMethod = value(form, "paymentMethod");
  await prisma.invoice.update({
    where: { id: z.string().min(1).parse(value(form, "id")) },
    data: {
      status,
      paidAt: status === "PAGO" ? new Date() : null,
      paymentMethod: status === "PAGO" ? z.nativeEnum(PaymentMethod).parse(paymentMethod) : null,
    },
  });
  revalidatePath("/financeiro");
  revalidatePath("/inicio");
}
