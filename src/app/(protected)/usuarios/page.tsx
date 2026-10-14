import { Search } from "lucide-react";
import { AutoFilterForm } from "@/components/auto-filter-form";
import { TechnicalAccessSwitch } from "@/components/technical-access-switch";
import { UserDialog } from "@/components/user-dialog";
import { DataTable, PageHeader, StatusBadge } from "@/components/ui";
import { toggleUserActive } from "@/app/actions/usuarios";
import { requirePermission } from "@/lib/guards";
import { getPagination } from "@/lib/query-pagination";
import { enumLabels, labelFor } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const roles = ["ADMIN", "COORDENADOR", "SECRETARIA", "PROFESSOR", "PSICOLOGO", "ASSISTENTE_SOCIAL", "FINANCEIRO"].map(
  (value) => [value, enumLabels[value]] as [string, string],
);

type SearchParams = { q?: string; page?: string; pageSize?: string };

export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePermission("users");
  const { page, pageSize, skip } = getPagination(searchParams.page, searchParams.pageSize);
  const where = searchParams.q?.trim()
    ? {
        OR: [
          { name: { contains: searchParams.q.trim(), mode: "insensitive" as const } },
          { email: { contains: searchParams.q.trim(), mode: "insensitive" as const } },
        ],
      }
    : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { name: "asc" }, skip, take: pageSize }),
    prisma.user.count({ where }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Gestão de acessos" title="Usuários do Sistema" action={<UserDialog roles={roles} />} />
      <AutoFilterForm className="mb-4">
        <label className="relative block w-full max-w-md">
          <span className="sr-only">Buscar usuários por nome ou e-mail</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 py-2 pl-9 pr-3 text-sm"
          />
        </label>
      </AutoFilterForm>
      <DataTable
        headers={["Usuário", "Telefone", "Perfil", "Cargo / registro", "Acesso", "Permissões técnicas", "Ações"]}
        count={total}
        page={page}
        pageSize={pageSize}
      >
        {users.map((user) => (
          <tr key={user.id}>
            <td className="px-4 py-3">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-neutral-500">{user.email}</p>
            </td>
            <td className="px-4 py-3 text-sm text-neutral-400">{user.phone ?? "—"}</td>
            <td className="px-4 py-3">
              <StatusBadge tone={user.role === "ADMIN" ? "blue" : user.role === "PROFESSOR" ? "amber" : "green"}>
                {labelFor(user.role)}
              </StatusBadge>
            </td>
            <td className="px-4 py-3 text-right">
              <div className="flex flex-col items-end gap-1">
                <StatusBadge tone={user.professionalRegistry ? "blue" : "neutral"}>
                  {user.professionalRegistry ?? "Sem registro"}
                </StatusBadge>
                <span className="text-xs text-neutral-400">{user.jobTitle ?? "—"}</span>
              </div>
            </td>
            <td className="px-4 py-3">
              <form action={toggleUserActive}>
                <input type="hidden" name="id" value={user.id} />
                <input type="hidden" name="active" value={String(!user.active)} />
                <button aria-label={user.active ? "Desativar usuário" : "Ativar usuário"}>
                  <StatusBadge tone={user.active ? "green" : "red"}>{user.active ? "Ativo" : "Inativo"}</StatusBadge>
                </button>
              </form>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-col gap-2">
                <TechnicalAccessSwitch user={user} flag="accessPsicologia" label="Psicologia" />
                <TechnicalAccessSwitch user={user} flag="accessServicoSocial" label="Serviço Social" />
              </div>
            </td>
            <td className="px-4 py-3">
              <UserDialog user={user} roles={roles} />
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
