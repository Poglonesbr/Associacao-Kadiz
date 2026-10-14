"use server";

import { AccessAction, AlunoStatus, DocumentStatus, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAccess } from "@/lib/audit";
import { requirePermission } from "@/lib/guards";
import { canAccessTurma } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (value: string) => value || null;
const isValidDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const docTypes = ["FICHA_CADASTRAL", "RG", "COMPROVANTE_RESIDENCIA", "ATESTADO_MEDICO", "CARTEIRA_VACINACAO", "CARTAO_SUS", "BOLETIM_ESCOLAR", "ELETROCARDIOGRAMA", "FOTO", "TERMO_RESPONSABILIDADE"] as const;

export async function createStudent(form: FormData) {
  const user = await requirePermission("students:write");
  const data = z.object({
    fullName: z.string().min(2), birthDate: z.string().refine(isValidDate),
    guardianName: z.string().min(2), guardianRelation: z.enum(["MAE", "PAI", "AVO", "TIO", "IRMAO", "TUTOR", "OUTRO"]),
    poloId: z.string().min(1), vinculo: z.enum(["PARTICULAR", "PROJETO_SOCIAL"]),
  }).parse(Object.fromEntries(["fullName", "birthDate", "guardianName", "guardianRelation", "poloId", "vinculo"].map((key) => [key, value(form, key)])));
  const turmaId = optional(value(form, "turmaId"));
  if (turmaId) {
    const turma = await prisma.turma.findUnique({ where: { id: turmaId }, select: { poloId: true } });
    if (!turma || turma.poloId !== data.poloId) throw new Error("A turma selecionada não pertence ao polo informado.");
  }
  const householdSize = data.vinculo === "PROJETO_SOCIAL" && value(form, "householdSize")
    ? z.coerce.number().int().min(1).max(50).parse(value(form, "householdSize"))
    : null;
  const year = new Date().getFullYear();
  const sequence = await prisma.aluno.count({ where: { matricula: { startsWith: `K${year}-` } } });
  const student = await prisma.aluno.create({ data: {
    matricula: `K${year}-${String(sequence + 1).padStart(4, "0")}`, ...data,
    birthDate: new Date(`${data.birthDate}T12:00:00`),
    startDate: isValidDate(value(form, "startDate")) ? new Date(`${value(form, "startDate")}T12:00:00`) : null,
    turmaId, householdSize, cpf: optional(value(form, "cpf")), rg: optional(value(form, "rg")),
    sex: optional(value(form, "sex")), ethnicity: optional(value(form, "ethnicity")), naturalidade: optional(value(form, "naturalidade")),
    address: optional(value(form, "address")), addressNumber: optional(value(form, "addressNumber")), neighborhood: optional(value(form, "neighborhood")),
    city: optional(value(form, "city")), school: optional(value(form, "school")), schoolGrade: optional(value(form, "schoolGrade")),
    schoolShift: (optional(value(form, "schoolShift")) as "MATUTINO" | "VESPERTINO" | null),
    position: optional(value(form, "position")), shirtNumber: optional(value(form, "shirtNumber")),
    dominantFoot: optional(value(form, "dominantFoot")) as "DESTRO" | "CANHOTO" | "AMBIDESTRO" | null,
    weekdays: form.getAll("weekdays").map(String), guardianPhone: optional(value(form, "guardianPhone")),
    guardianEmail: optional(value(form, "guardianEmail")), guardianCpf: optional(value(form, "guardianCpf")),
    motherName: optional(value(form, "motherName")), motherJob: optional(value(form, "motherJob")), motherPhone: optional(value(form, "motherPhone")),
    fatherName: optional(value(form, "fatherName")), fatherJob: optional(value(form, "fatherJob")), fatherPhone: optional(value(form, "fatherPhone")),
    otherGuardian: optional(value(form, "otherGuardian")), hasHealthPlan: value(form, "hasHealthPlan") ? value(form, "hasHealthPlan") === "true" : null,
    bloodType: optional(value(form, "bloodType")), chronicDisease: optional(value(form, "chronicDisease")),
    continuousMedication: optional(value(form, "continuousMedication")), allergies: optional(value(form, "allergies")),
    foodRestrictions: optional(value(form, "foodRestrictions")), surgeries: optional(value(form, "surgeries")),
    psychFollowUp: value(form, "psychFollowUp") === "true", difficulties: form.getAll("difficulties").map(String),
    difficultiesOther: optional(value(form, "difficultiesOther")), susCard: optional(value(form, "susCard")), medicalNotes: optional(value(form, "medicalNotes")),
    emergencyName: optional(value(form, "emergencyName")), emergencyRelation: optional(value(form, "emergencyRelation")), emergencyPhone: optional(value(form, "emergencyPhone")),
    authTrips: form.get("authTrips") === "on", authImage: form.get("authImage") === "on", authTermsAccepted: form.get("authTermsAccepted") === "on",
    monthlyFee: data.vinculo === "PARTICULAR" && value(form, "monthlyFee") ? Number(value(form, "monthlyFee").replace(",", ".")) : undefined,
    billingDay: data.vinculo === "PARTICULAR" && value(form, "billingDay") ? Number(value(form, "billingDay")) : undefined,
    invoiceName: optional(value(form, "invoiceName")), invoiceCpf: optional(value(form, "invoiceCpf")), invoiceEmail: optional(value(form, "invoiceEmail")),
  } });
  await prisma.studentDocument.createMany({ data: docTypes.filter((type) => type !== "TERMO_RESPONSABILIDADE" || student.vinculo === "PROJETO_SOCIAL").map((type) => ({ alunoId: student.id, type })) });
  if (student.vinculo === "PARTICULAR" && student.monthlyFee) {
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 15);
    await prisma.invoice.create({ data: { alunoId: student.id, referenceMonth: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}`, amount: student.monthlyFee, dueDate } });
  }
  await logAccess({ userId: user.id, action: AccessAction.CREATE, resource: "Aluno", resourceId: student.id, alunoId: student.id });
  revalidatePath("/alunos");
  redirect(`/alunos/${student.id}`);
}

export async function updateStudent(form: FormData) {
  const user = await requirePermission("students:write");
  const id = value(form, "id");
  const fullName = z.string().min(2).parse(value(form, "fullName"));
  const birthDate = value(form, "birthDate");
  if (!isValidDate(birthDate)) throw new Error("Data de nascimento inválida.");
  const current = await prisma.aluno.findUnique({ where: { id }, select: { vinculo: true } });
  if (!current) throw new Error("Aluno não encontrado.");
  const householdSize = current.vinculo === "PROJETO_SOCIAL" && value(form, "householdSize")
    ? z.coerce.number().int().min(1).max(50).parse(value(form, "householdSize"))
    : null;
  await prisma.aluno.update({ where: { id }, data: { fullName, birthDate: new Date(`${birthDate}T12:00:00`), guardianName: value(form, "guardianName"), guardianPhone: optional(value(form, "guardianPhone")), address: optional(value(form, "address")), school: optional(value(form, "school")), householdSize } });
  await logAccess({ userId: user.id, action: AccessAction.UPDATE, resource: "Aluno", resourceId: id, alunoId: id });
  revalidatePath(`/alunos/${id}`);
}

export async function setStudentStatus(form: FormData) {
  await requirePermission("students:write");
  const id = value(form, "id");
  const status = z.nativeEnum(AlunoStatus).parse(value(form, "status"));
  await prisma.aluno.update({ where: { id }, data: { status, exitDate: status === "DESLIGADO" ? new Date() : null, exitReason: optional(value(form, "reason")) } });
  revalidatePath("/alunos");
}

export async function createUser(form: FormData) {
  await requirePermission("users");
  const name = z.string().min(2).parse(value(form, "name"));
  const email = z.string().email().parse(value(form, "email")).toLowerCase();
  const password = z.string().min(8).parse(value(form, "password"));
  const role = z.nativeEnum(Role).parse(value(form, "role"));
  await prisma.user.create({ data: { name, email, passwordHash: await hash(password, 12), role, jobTitle: optional(value(form, "jobTitle")), professionalRegistry: optional(value(form, "professionalRegistry")) } });
  revalidatePath("/usuarios");
}

export async function editUser(form: FormData) {
  await requirePermission("users");
  const id = value(form, "id");
  const name = z.string().min(2).parse(value(form, "name"));
  const role = z.nativeEnum(Role).parse(value(form, "role"));
  await prisma.user.update({ where: { id }, data: { name, role, phone: optional(value(form, "phone")), jobTitle: optional(value(form, "jobTitle")), professionalRegistry: optional(value(form, "professionalRegistry")) } });
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
  await logAccess({ userId: admin.id, action: enabled ? AccessAction.GRANT : AccessAction.REVOKE, resource: flag, resourceId: id });
  revalidatePath("/usuarios");
}

export async function createPolo(form: FormData) {
  await requirePermission("poles");
  await prisma.polo.create({ data: { name: z.string().min(2).parse(value(form, "name")), type: z.enum(["SEDE", "ESCOLA_POLO"]).parse(value(form, "type")), address: optional(value(form, "address")) } });
  revalidatePath("/polos");
}

export async function updatePolo(form: FormData) {
  await requirePermission("poles");
  await prisma.polo.update({ where: { id: value(form, "id") }, data: {
    name: z.string().min(2).parse(value(form, "name")),
    type: z.enum(["SEDE", "ESCOLA_POLO"]).parse(value(form, "type")),
    address: optional(value(form, "address")),
    active: value(form, "active") !== "false",
  } });
  revalidatePath("/polos");
}

export async function createTurma(form: FormData) {
  await requirePermission("poles");
  const name = z.string().min(2).parse(value(form, "name"));
  const poloId = z.string().min(1).parse(value(form, "poloId"));
  const modality = z.enum(["FUTEBOL", "FUTSAL", "XADREZ", "REFORCO_ESCOLAR", "HORTA", "OUTRO"]).parse(value(form, "modality"));
  const shift = z.enum(["MANHA", "TARDE", "NOITE"]).parse(value(form, "shift"));
  await prisma.turma.create({ data: { name, poloId, modality, shift, startTime: value(form, "startTime"), endTime: value(form, "endTime"), weekdays: form.getAll("weekdays").map(String), professorId: optional(value(form, "professorId")) } });
  revalidatePath("/polos");
}

export async function updateTurma(form: FormData) {
  await requirePermission("poles");
  const id = value(form, "id");
  const name = z.string().min(2).parse(value(form, "name"));
  const shift = z.enum(["MANHA", "TARDE", "NOITE"]).parse(value(form, "shift"));
  const modality = z.enum(["FUTEBOL", "FUTSAL", "XADREZ", "REFORCO_ESCOLAR", "HORTA", "OUTRO"]).parse(value(form, "modality"));
  await prisma.turma.update({ where: { id }, data: { name, shift, modality, startTime: value(form, "startTime"), endTime: value(form, "endTime"), active: value(form, "active") !== "false" } });
  revalidatePath("/polos");
}

export async function updateDocument(form: FormData) {
  const user = await requirePermission("documents");
  const id = value(form, "id");
  const status = z.nativeEnum(DocumentStatus).parse(value(form, "status"));
  await prisma.studentDocument.update({ where: { id }, data: { status, reviewedById: user.id, deliveredAt: status === "ENTREGUE" ? new Date() : undefined } });
  revalidatePath("/documentos");
}

export async function saveAttendance(form: FormData) {
  const user = await requirePermission("attendance");
  const turmaId = z.string().min(1).parse(value(form, "turmaId"));
  const turma = await prisma.turma.findUnique({ where: { id: turmaId }, select: { professorId: true } });
  if (!turma || !canAccessTurma(user, turma.professorId)) throw new Error("Acesso não autorizado para esta turma.");
  const date = value(form, "date");
  if (!isValidDate(date)) throw new Error("Data inválida.");
  const records = z.array(z.object({ alunoId: z.string(), status: z.enum(["PRESENTE", "FALTA", "FALTA_JUSTIFICADA"]) })).parse(JSON.parse(value(form, "records")));
  const sessionDate = new Date(`${date}T12:00:00`);
  await prisma.attendanceSession.upsert({
    where: { turmaId_date: { turmaId, date: sessionDate } },
    create: { turmaId, date: sessionDate, takenById: user.id, records: { create: records } },
    update: { takenById: user.id, records: { deleteMany: {}, create: records } },
  });
  revalidatePath("/chamada");
}

export async function createTask(form: FormData) {
  const user = await requirePermission("tasks");
  const title = z.string().min(2).parse(value(form, "title"));
  await prisma.task.create({ data: { title, createdById: user.id } });
  revalidatePath("/tarefas");
}
