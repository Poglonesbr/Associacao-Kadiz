import { PageHeader, Panel } from "@/components/ui";
import type { Permission } from "@/lib/permissions";
import { requirePermission } from "@/lib/guards";
import { logAccess } from "@/lib/audit";

export async function ConstructionPage({
  title,
  permission,
  confidential = false,
}: {
  title: string;
  permission: Permission;
  confidential?: boolean;
}) {
  const user = await requirePermission(permission);
  if (confidential) await logAccess({ userId: user.id, action: "VIEW", resource: title });
  return (
    <>
      <PageHeader eyebrow="Gestão Kadiz" title={title} />
      <Panel className="p-10 text-center">
        <p className="text-lg font-medium">Em construção</p>
        <p className="mt-2 text-sm text-neutral-400">Esta área será disponibilizada em uma próxima etapa do sistema.</p>
        {confidential && (
          <p className="mt-5 rounded-lg bg-amber-950/50 p-3 text-sm text-amber-200">
            Conteúdo sigiloso — acesso registrado.
          </p>
        )}
      </Panel>
    </>
  );
}
