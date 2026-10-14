import { Prisma } from "@prisma/client";

export type StudentFilters = {
  q?: string;
  polo?: string;
  turma?: string;
  vinculo?: string;
  status?: string;
  categoria?: string;
};

const studentStatuses = ["ATIVO", "INATIVO", "LISTA_ESPERA", "DESLIGADO"] as const;
const studentLinks = ["PARTICULAR", "PROJETO_SOCIAL"] as const;

function categoryBirthRange(category: string): Prisma.DateTimeFilter | undefined {
  const match = /^Sub-(\d+)$/.exec(category);
  const age = Number(match?.[1]);
  if (!match || !Number.isInteger(age) || age < 2 || age % 2 !== 0) return undefined;

  const today = new Date();
  const yearsAgo = (years: number) => {
    const date = new Date(today);
    const month = date.getMonth();
    date.setFullYear(date.getFullYear() - years);
    if (date.getMonth() !== month) date.setDate(0);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  const oldestBoundary = yearsAgo(age + 1);
  oldestBoundary.setDate(oldestBoundary.getDate() + 1);
  return { gt: oldestBoundary, lte: yearsAgo(age - 1) };
}

export function buildStudentWhere(filters: StudentFilters): Prisma.AlunoWhereInput {
  const vinculo = studentLinks.find((value) => value === filters.vinculo);
  const status = studentStatuses.find((value) => value === filters.status);
  const birthDate = filters.categoria ? categoryBirthRange(filters.categoria) : undefined;

  return {
    ...(filters.q?.trim() ? { fullName: { contains: filters.q.trim(), mode: "insensitive" as const } } : {}),
    ...(filters.polo ? { poloId: filters.polo } : {}),
    ...(filters.turma ? { turmaId: filters.turma } : {}),
    ...(vinculo ? { vinculo } : {}),
    ...(status ? { status } : {}),
    ...(birthDate ? { birthDate } : {}),
  };
}
