import { redirect } from "next/navigation";
import { requireTecnico } from "@/lib/guards";
import { getTechnicalAreas } from "@/lib/permissions";

export default async function AttendedIndexPage() {
  const user = await requireTecnico();
  const areas = getTechnicalAreas(user);
  redirect(areas.includes("SERVICO_SOCIAL") ? "/servico-social/atendidos" : "/psicologia/atendidos");
}
