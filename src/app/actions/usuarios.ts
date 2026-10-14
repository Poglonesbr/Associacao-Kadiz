"use server";

import { AccessAction, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAccess } from "@/lib/audit";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (input: string) => input || null;

export async function createUser(form: FormData) {
  await requirePermission("users");
  const name = z.string().min(2).parse(value(form, "name"));
  const email = z.string().email().parse(value(form, "email")).toLowerCase();
  const password = z.string().min(8).parse(value(form, "password"));
  const role = z.nativeEnum(Role).parse(value(form, "role"));
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hash(password, 12),
      role,
      jobTitle: optional(value(form, "jobTitle")),
      professionalRegistry: optional(value(form, "professionalRegistry")),
    },
  });
  revalidatePath("/usuarios");
}

export async function editUser(form: FormData) {
  await requirePermission("users");
  const id = value(form, "id");
  const name = z.string().min(2).parse(value(form, "name"));
  const role = z.nativeEnum(Role).parse(value(form, "role"));
  await prisma.user.update({
    where: { id },
    data: {
      name,
      role,
      phone: optional(value(form, "phone")),
      jobTitle: optional(value(form, "jobTitle")),
      professionalRegistry: optional(value(form, "professionalRegistry")),
    },
  });
  revalidatePath("/usuarios");
}

export async function toggleUserActive(form: FormData) {
  await requirePermission("users");
  await prisma.user.update({ where: { id: value(form, "id") }, data: { active: value(form, "active") === "true" } });
  revalidatePath("/usuarios");
}

export async function resetUserPassword(form: FormData) {
  await requirePermission("users");
  const password = z.string().min(8).parse(value(form, "password"));
  await prisma.user.update({ where: { id: value(form, "id") }, data: { passwordHash: await hash(password, 12) } });
  revalidatePath("/usuarios");
}

export async function setConfidentialAccess(form: FormData) {
  const admin = await requirePermission("users");
  const id = value(form, "id");
  const flag = z.enum(["accessPsicologia", "accessServicoSocial"]).parse(value(form, "flag"));
  const enabled = value(form, "enabled") === "true";
  await prisma.user.update({ where: { id }, data: { [flag]: enabled } });
  await logAccess({
    userId: admin.id,
    action: enabled ? AccessAction.GRANT : AccessAction.REVOKE,
    resource: flag,
    resourceId: id,
  });
  revalidatePath("/usuarios");
}
