import { StudentWizard } from "@/components/student-wizard";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export default async function NewStudentPage() {
  await requirePermission("students:write");
  const [polos, turmas] = await Promise.all([
    prisma.polo.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.turma.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  return <StudentWizard polos={polos} turmas={turmas} />;
}
