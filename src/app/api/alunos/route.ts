import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NextResponse } from "next/server";
import { getCategory } from "@/lib/category";
import { labelFor } from "@/lib/labels";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { buildStudentWhere } from "@/lib/student-query";

export async function GET(request: Request) {
  await requirePermission("students:view");
  const { searchParams } = new URL(request.url);
  const students = await prisma.aluno.findMany({
    where: buildStudentWhere({
      q: searchParams.get("q") ?? undefined,
      polo: searchParams.get("polo") ?? undefined,
      turma: searchParams.get("turma") ?? undefined,
      vinculo: searchParams.get("vinculo") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      categoria: searchParams.get("categoria") ?? undefined,
    }),
    include: { polo: true, turma: true },
    orderBy: { fullName: "asc" },
  });
  const columns = [
    "Matrícula",
    "Aluno",
    "Vínculo",
    "Polo",
    "Turma",
    "Categoria",
    "Nascimento",
    "Responsável",
    "Telefone",
    "Status",
  ];
  const rows = students.map((student) => [
    student.matricula,
    student.fullName,
    student.vinculo === "PROJETO_SOCIAL" ? "Projeto Social" : "Particular",
    student.polo.name,
    student.turma?.name ?? "",
    getCategory(student.birthDate),
    format(student.birthDate, "dd/MM/yyyy", { locale: ptBR }),
    student.guardianName,
    student.guardianPhone ?? "",
    labelFor(student.status),
  ]);
  const escape = (value: string) => {
    const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${safeValue.replaceAll('"', '""')}"`;
  };
  const csv = [columns, ...rows].map((row) => row.map(escape).join(";")).join("\r\n");

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="alunos.csv"',
      "Cache-Control": "no-store",
    },
  });
}
