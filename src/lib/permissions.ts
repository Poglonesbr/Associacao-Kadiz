import type { Role, User } from "@prisma/client";

export type PermissionUser = Pick<User, "id" | "role" | "accessPsicologia" | "accessServicoSocial">;
export type Permission =
  | "dashboard"
  | "students:view"
  | "students:write"
  | "documents"
  | "attendance"
  | "attendance:all"
  | "poles"
  | "stock"
  | "finance"
  | "tasks"
  | "calendar"
  | "snacks"
  | "users"
  | "audit"
  | "psychology"
  | "social-work"
  | "referrals:view"
  | "referrals:write";

const staff: Role[] = [
  "ADMIN",
  "COORDENADOR",
  "SECRETARIA",
  "PROFESSOR",
  "PSICOLOGO",
  "ASSISTENTE_SOCIAL",
  "FINANCEIRO",
];
const studentEditors: Role[] = ["ADMIN", "COORDENADOR", "SECRETARIA"];
const office: Role[] = ["ADMIN", "COORDENADOR", "SECRETARIA"];

export function canViewPsicologia(user: PermissionUser): boolean {
  return user.role === "PSICOLOGO" || user.accessPsicologia;
}

export function canViewServicoSocial(user: PermissionUser): boolean {
  return user.role === "ASSISTENTE_SOCIAL" || user.accessServicoSocial;
}

export function can(user: PermissionUser, permission: Permission): boolean {
  switch (permission) {
    case "dashboard":
      return staff.includes(user.role);
    case "students:view":
      return staff.includes(user.role);
    case "students:write":
      return studentEditors.includes(user.role);
    case "documents":
    case "tasks":
      return office.includes(user.role);
    case "attendance":
      return ["ADMIN", "COORDENADOR", "SECRETARIA", "PROFESSOR"].includes(user.role);
    case "attendance:all":
      return office.includes(user.role);
    case "poles":
    case "stock":
      return ["ADMIN", "COORDENADOR", "SECRETARIA"].includes(user.role);
    case "finance":
      return ["ADMIN", "FINANCEIRO", "SECRETARIA"].includes(user.role);
    case "calendar":
    case "snacks":
      return [...office, "PROFESSOR"].includes(user.role);
    case "users":
    case "audit":
      return user.role === "ADMIN";
    case "psychology":
      return canViewTechnicalDashboard(user, "PSICOLOGIA");
    case "social-work":
      return canViewTechnicalDashboard(user, "SERVICO_SOCIAL");
    case "referrals:view":
      return canViewPsicologia(user) || canViewServicoSocial(user) || ["ADMIN", "COORDENADOR"].includes(user.role);
    case "referrals:write":
      return canViewPsicologia(user) || canViewServicoSocial(user);
  }
}

export function canViewStudentFinancial(user: PermissionUser): boolean {
  return ["ADMIN", "FINANCEIRO", "SECRETARIA"].includes(user.role);
}

export type TechnicalArea = "PSICOLOGIA" | "SERVICO_SOCIAL";

export function canViewTechnicalArea(user: PermissionUser, area: TechnicalArea): boolean {
  return area === "PSICOLOGIA" ? canViewPsicologia(user) : canViewServicoSocial(user);
}

export function isTecnico(user: PermissionUser): boolean {
  return canViewPsicologia(user) || canViewServicoSocial(user);
}

export function getTechnicalAreas(user: PermissionUser): TechnicalArea[] {
  return (["PSICOLOGIA", "SERVICO_SOCIAL"] as const).filter((area) => canViewTechnicalArea(user, area));
}

export function canViewTechnicalDashboard(user: PermissionUser, area?: TechnicalArea): boolean {
  const managementRole = user.role === "ADMIN" || user.role === "COORDENADOR";
  return (area ? canViewTechnicalArea(user, area) : isTecnico(user)) || managementRole;
}

export function canAccessTurma(user: PermissionUser, professorId: string | null): boolean {
  return user.role !== "PROFESSOR" || professorId === user.id;
}

export function canViewNavigation(user: PermissionUser, permission: Permission): boolean {
  return can(user, permission);
}

export function hasAnyRole(user: PermissionUser, roles: Role[]): boolean {
  return roles.includes(user.role);
}
