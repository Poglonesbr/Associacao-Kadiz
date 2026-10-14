import { AccessAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logAccess(input: {
  userId: string;
  action: AccessAction;
  resource: string;
  resourceId?: string;
  alunoId?: string;
}) {
  return prisma.accessLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      alunoId: input.alunoId,
    },
  });
}
