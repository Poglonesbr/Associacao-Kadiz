import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";

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
