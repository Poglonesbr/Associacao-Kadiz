import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  can,
  canViewTechnicalDashboard,
  canViewTechnicalArea,
  isTecnico,
  type Permission,
  type TechnicalArea,
} from "@/lib/permissions";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!can(user, permission)) redirect("/403");
  return user;
}

export async function requireTecnico() {
  const user = await getCurrentUser();
  if (!isTecnico(user)) redirect("/403");
  return user;
}

export async function requireTechnicalDashboard(area: TechnicalArea) {
  const user = await getCurrentUser();
  if (!canViewTechnicalDashboard(user, area) || (!canViewTechnicalArea(user, area) && isTecnico(user)))
    redirect("/403");
  return user;
}
