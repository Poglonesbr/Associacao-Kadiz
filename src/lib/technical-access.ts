import { canViewTechnicalArea, type PermissionUser, type TechnicalArea } from "@/lib/permissions";

export function isAtendidoEligible(vinculo: string): boolean {
  return vinculo === "PROJETO_SOCIAL";
}

export function filterTechnicalRows<T extends { area: TechnicalArea }>(rows: T[], user: PermissionUser): T[] {
  return rows.filter(({ area }) => canViewTechnicalArea(user, area));
}
