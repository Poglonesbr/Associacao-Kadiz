"use server";

import { AccessAction, AlunoStatus, DominantFoot, GuardianRelation, SchoolShift, Vinculo } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAccess } from "@/lib/audit";
import { parseBrazilianDate } from "@/lib/dates";
import { requirePermission } from "@/lib/guards";
import { canViewStudentFinancial } from "@/lib/permissions";
import { parseBrazilianCurrency } from "@/lib/money";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (input: string) => input || null;
const isValidDate = (input: string, notFuture = false) => Boolean(parseBrazilianDate(input, { notFuture }));
const docTypes = [
  "FICHA_CADASTRAL",
  "RG",
  "COMPROVANTE_RESIDENCIA",
  "ATESTADO_MEDICO",
  "CARTEIRA_VACINACAO",
  "CARTAO_SUS",
  "BOLETIM_ESCOLAR",
  "ELETROCARDIOGRAMA",
  "FOTO",
  "TERMO_RESPONSABILIDADE",
] as const;

export async function createStudent(form: FormData) {
  const user = await requirePermission("students:write");
  const data = z
    .object({
      fullName: z.string().min(2),
      birthDate: z.string().refine((date) => isValidDate(date, true)),
      guardianName: z.string().min(2),
      guardianRelation: z.enum(["MAE", "PAI", "AVO", "TIO", "IRMAO", "TUTOR", "OUTRO"]),
      poloId: z.string().min(1),
      vinculo: z.enum(["PARTICULAR", "PROJETO_SOCIAL"]),
    })
    .parse(
      Object.fromEntries(
        ["fullName", "birthDate", "guardianName", "guardianRelation", "poloId", "vinculo"].map((key) => [
          key,
          value(form, key),
        ]),
      ),
    );
  const birthDateIso = parseBrazilianDate(data.birthDate, { notFuture: true });
  const startDateInput = value(form, "startDate");
  const startDateIso = startDateInput ? parseBrazilianDate(startDateInput) : null;
  if (!birthDateIso || (startDateInput && !startDateIso))
    throw new Error("Informe datas válidas no formato dd/mm/aaaa.");
  const turmaId = optional(value(form, "turmaId"));
  if (turmaId) {
    const turma = await prisma.turma.findUnique({ where: { id: turmaId }, select: { poloId: true } });
    if (!turma || turma.poloId !== data.poloId) throw new Error("A turma selecionada não pertence ao polo informado.");
  }
  const householdSize =
    data.vinculo === "PROJETO_SOCIAL" && value(form, "householdSize")
      ? z.coerce.number().int().min(1).max(50).parse(value(form, "householdSize"))
      : null;
  const monthlyFeeInput = data.vinculo === "PARTICULAR" ? value(form, "monthlyFee") : "";
  const monthlyFee = parseBrazilianCurrency(monthlyFeeInput);
  if (monthlyFeeInput && (monthlyFee === null || monthlyFee < 0)) throw new Error("Mensalidade inválida.");
  const year = new Date().getFullYear();
  const sequence = await prisma.aluno.count({ where: { matricula: { startsWith: `K${year}-` } } });
  const student = await prisma.aluno.create({
    data: {
      matricula: `K${year}-${String(sequence + 1).padStart(4, "0")}`,
      ...data,
      birthDate: new Date(`${birthDateIso}T12:00:00`),
      startDate: startDateIso ? new Date(`${startDateIso}T12:00:00`) : null,
      turmaId,
      householdSize,
      cpf: optional(value(form, "cpf")),
      rg: optional(value(form, "rg")),
      sex: optional(value(form, "sex")),
      ethnicity: optional(value(form, "ethnicity")),
      naturalidade: optional(value(form, "naturalidade")),
      address: optional(value(form, "address")),
      addressNumber: optional(value(form, "addressNumber")),
      neighborhood: optional(value(form, "neighborhood")),
      city: optional(value(form, "city")),
      state: optional(value(form, "state")),
      postalCode: optional(value(form, "postalCode")),
      school: optional(value(form, "school")),
      schoolGrade: optional(value(form, "schoolGrade")),
      schoolShift: optional(value(form, "schoolShift")) as "MATUTINO" | "VESPERTINO" | null,
      position: optional(value(form, "position")),
      shirtNumber: optional(value(form, "shirtNumber")),
      dominantFoot: optional(value(form, "dominantFoot")) as "DESTRO" | "CANHOTO" | "AMBIDESTRO" | null,
      weekdays: form.getAll("weekdays").map(String),
      guardianPhone: optional(value(form, "guardianPhone")),
      guardianEmail: optional(value(form, "guardianEmail")),
      guardianCpf: optional(value(form, "guardianCpf")),
      motherName: optional(value(form, "motherName")),
      motherJob: optional(value(form, "motherJob")),
      motherPhone: optional(value(form, "motherPhone")),
      fatherName: optional(value(form, "fatherName")),
      fatherJob: optional(value(form, "fatherJob")),
      fatherPhone: optional(value(form, "fatherPhone")),
      otherGuardian: optional(value(form, "otherGuardian")),
      hasHealthPlan: value(form, "hasHealthPlan") ? value(form, "hasHealthPlan") === "true" : null,
      bloodType: optional(value(form, "bloodType")),
      chronicDisease: optional(value(form, "chronicDisease")),
      continuousMedication: optional(value(form, "continuousMedication")),
      allergies: optional(value(form, "allergies")),
      foodRestrictions: optional(value(form, "foodRestrictions")),
      surgeries: optional(value(form, "surgeries")),
      psychFollowUp: value(form, "psychFollowUp") === "true",
      difficulties: form.getAll("difficulties").map(String),
      difficultiesOther: optional(value(form, "difficultiesOther")),
      susCard: optional(value(form, "susCard")),
      medicalNotes: optional(value(form, "medicalNotes")),
      emergencyName: optional(value(form, "emergencyName")),
      emergencyRelation: optional(value(form, "emergencyRelation")),
      emergencyPhone: optional(value(form, "emergencyPhone")),
      authTrips: form.get("authTrips") === "on",
      authImage: form.get("authImage") === "on",
      authTermsAccepted: form.get("authTermsAccepted") === "on",
      monthlyFee: monthlyFee ?? undefined,
      billingDay:
        data.vinculo === "PARTICULAR" && value(form, "billingDay") ? Number(value(form, "billingDay")) : undefined,
      invoiceName: optional(value(form, "invoiceName")),
      invoiceCpf: optional(value(form, "invoiceCpf")),
      invoiceEmail: optional(value(form, "invoiceEmail")),
    },
  });
  await prisma.studentDocument.createMany({
    data: docTypes
      .filter((type) => type !== "TERMO_RESPONSABILIDADE" || student.vinculo === "PROJETO_SOCIAL")
      .map((type) => ({ alunoId: student.id, type })),
  });
  if (student.vinculo === "PARTICULAR" && student.monthlyFee) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);
    await prisma.invoice.create({
      data: {
        alunoId: student.id,
        referenceMonth: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}`,
        amount: student.monthlyFee,
        dueDate,
      },
    });
  }
  await logAccess({
    userId: user.id,
    action: AccessAction.CREATE,
    resource: "Aluno",
    resourceId: student.id,
    alunoId: student.id,
  });
  revalidatePath("/alunos");
  redirect(`/alunos/${student.id}`);
}

export async function updateStudent(form: FormData) {
  const user = await requirePermission("students:write");
  const id = z.string().min(1).parse(value(form, "id"));
  const current = await prisma.aluno.findUnique({
    where: { id },
    select: { vinculo: true, poloId: true, turmaId: true },
  });
  if (!current) throw new Error("Aluno não encontrado.");
  const nextVinculo = form.has("vinculo") ? z.nativeEnum(Vinculo).parse(value(form, "vinculo")) : current.vinculo;
  const poloId = form.has("poloId") ? z.string().min(1).parse(value(form, "poloId")) : current.poloId;
  const turmaId = form.has("turmaId") ? optional(value(form, "turmaId")) : current.turmaId;
  if (turmaId) {
    const turma = await prisma.turma.findUnique({ where: { id: turmaId }, select: { poloId: true } });
    if (!turma || turma.poloId !== poloId) throw new Error("A turma selecionada não pertence ao polo informado.");
  }
  const financialFields = ["monthlyFee", "billingDay", "invoiceName", "invoiceCpf", "invoiceEmail"];
  if (financialFields.some((field) => form.has(field)) && !canViewStudentFinancial(user)) {
    throw new Error("Você não tem permissão para alterar dados financeiros.");
  }
  const data: Record<string, unknown> = {};
  const textFields = [
    "cpf",
    "rg",
    "sex",
    "ethnicity",
    "naturalidade",
    "address",
    "addressNumber",
    "neighborhood",
    "city",
    "state",
    "postalCode",
    "school",
    "schoolGrade",
    "position",
    "shirtNumber",
    "guardianPhone",
    "guardianEmail",
    "guardianCpf",
    "motherName",
    "motherJob",
    "motherPhone",
    "fatherName",
    "fatherJob",
    "fatherPhone",
    "otherGuardian",
    "bloodType",
    "chronicDisease",
    "continuousMedication",
    "allergies",
    "foodRestrictions",
    "surgeries",
    "difficultiesOther",
    "susCard",
    "medicalNotes",
    "emergencyName",
    "emergencyRelation",
    "emergencyPhone",
    "invoiceName",
    "invoiceCpf",
    "invoiceEmail",
  ];
  for (const field of textFields) if (form.has(field)) data[field] = optional(value(form, field));
  if (form.has("fullName")) data.fullName = z.string().min(2).parse(value(form, "fullName"));
  if (form.has("guardianName")) data.guardianName = z.string().min(2).parse(value(form, "guardianName"));
  if (form.has("vinculo")) data.vinculo = nextVinculo;
  if (form.has("poloId")) data.poloId = poloId;
  if (form.has("turmaId")) data.turmaId = turmaId;
  if (form.has("birthDate")) {
    const date = parseBrazilianDate(value(form, "birthDate"), { notFuture: true });
    if (!date) throw new Error("Data de nascimento inválida.");
    data.birthDate = new Date(`${date}T12:00:00`);
  }
  if (form.has("startDate")) {
    const rawDate = value(form, "startDate");
    const date = rawDate ? parseBrazilianDate(rawDate) : null;
    if (rawDate && !date) throw new Error("Data de início inválida.");
    data.startDate = date ? new Date(`${date}T12:00:00`) : null;
  }
  if (form.has("schoolShift"))
    data.schoolShift = value(form, "schoolShift") ? z.nativeEnum(SchoolShift).parse(value(form, "schoolShift")) : null;
  if (form.has("guardianRelation"))
    data.guardianRelation = z.nativeEnum(GuardianRelation).parse(value(form, "guardianRelation"));
  if (form.has("dominantFoot"))
    data.dominantFoot = value(form, "dominantFoot")
      ? z.nativeEnum(DominantFoot).parse(value(form, "dominantFoot"))
      : null;
  if (form.has("householdSize")) {
    const rawSize = value(form, "householdSize");
    data.householdSize =
      nextVinculo === "PROJETO_SOCIAL" && rawSize ? z.coerce.number().int().min(1).max(50).parse(rawSize) : null;
  } else if (nextVinculo !== "PROJETO_SOCIAL") {
    data.householdSize = null;
  }
  if (form.has("_weekdaysPresent")) data.weekdays = form.getAll("weekdays").map(String);
  if (form.has("_difficultiesPresent")) data.difficulties = form.getAll("difficulties").map(String);
  for (const field of ["authTrips", "authImage", "authTermsAccepted", "hasUniform"] as const) {
    if (form.has(field)) data[field] = form.getAll(field).includes("true");
  }
  for (const field of ["hasHealthPlan", "psychFollowUp"] as const) {
    if (form.has(field)) {
      const raw = value(form, field);
      data[field] = raw === "" ? null : raw === "true";
    }
  }
  if (form.has("monthlyFee")) {
    const raw = value(form, "monthlyFee");
    const amount = parseBrazilianCurrency(raw);
    if (raw && (amount === null || amount < 0)) throw new Error("Mensalidade inválida.");
    data.monthlyFee = amount;
  }
  if (form.has("billingDay")) {
    const raw = value(form, "billingDay");
    data.billingDay = raw ? z.coerce.number().int().min(1).max(31).parse(raw) : null;
  }
  await prisma.aluno.update({ where: { id }, data: data as Prisma.AlunoUncheckedUpdateInput });
  await logAccess({ userId: user.id, action: AccessAction.UPDATE, resource: "Aluno", resourceId: id, alunoId: id });
  revalidatePath(`/alunos/${id}`);
}

export async function setStudentStatus(form: FormData) {
  const user = await requirePermission("students:write");
  const id = value(form, "id");
  const status = z.nativeEnum(AlunoStatus).parse(value(form, "status"));
  const reason =
    status === "DESLIGADO" ? z.string().min(3).parse(value(form, "reason")) : optional(value(form, "reason"));
  await prisma.aluno.update({
    where: { id },
    data: { status, exitDate: status === "DESLIGADO" ? new Date() : null, exitReason: reason },
  });
  await logAccess({ userId: user.id, action: AccessAction.UPDATE, resource: "Aluno", resourceId: id, alunoId: id });
  revalidatePath("/alunos");
}
