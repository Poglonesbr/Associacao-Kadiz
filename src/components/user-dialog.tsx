"use client";

import { useState } from "react";
import { createUser, editUser, resetUserPassword } from "@/app/actions/usuarios";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  jobTitle: string | null;
  professionalRegistry: string | null;
};

export function UserDialog({ user, roles }: { user?: UserRecord; roles: [string, string][] }) {
  const [open, setOpen] = useState(false);
  const action = user ? editUser : createUser;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
      >
        {user ? "Editar" : "+ Novo usuário"}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-dialog-title"
            className="my-auto w-full max-w-2xl rounded-xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="user-dialog-title" className="text-lg font-semibold">
                {user ? "Editar usuário" : "Novo usuário"}
              </h2>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
                className="rounded px-2 py-1 text-neutral-400 hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>
            <form action={action} className="grid gap-4 md:grid-cols-2">
              {user && <input type="hidden" name="id" value={user.id} />}
              <label className="space-y-1 text-sm">
                <span className="text-neutral-300">Nome</span>
                <input
                  name="name"
                  defaultValue={user?.name}
                  required
                  minLength={2}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-neutral-300">E-mail</span>
                <input
                  name="email"
                  type="email"
                  defaultValue={user?.email}
                  required={!user}
                  disabled={Boolean(user)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 disabled:opacity-60"
                />
              </label>
              {!user && (
                <label className="space-y-1 text-sm">
                  <span className="text-neutral-300">Senha inicial</span>
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    required
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
                  />
                </label>
              )}
              <label className="space-y-1 text-sm">
                <span className="text-neutral-300">Perfil</span>
                <select
                  name="role"
                  defaultValue={user?.role ?? "SECRETARIA"}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
                >
                  {roles.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-neutral-300">Telefone</span>
                <input
                  name="phone"
                  defaultValue={user?.phone ?? ""}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-neutral-300">Cargo</span>
                <input
                  name="jobTitle"
                  defaultValue={user?.jobTitle ?? ""}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-neutral-300">Registro profissional</span>
                <input
                  name="professionalRegistry"
                  defaultValue={user?.professionalRegistry ?? ""}
                  placeholder="Ex.: CRESS/SC 008736"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
                />
              </label>
              <div className="flex justify-end gap-2 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-neutral-700 px-3 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-black">
                  {user ? "Salvar" : "Criar usuário"}
                </button>
              </div>
              {user && (
                <div className="flex flex-wrap items-end gap-3 border-t border-neutral-800 pt-5 md:col-span-2">
                  <input type="hidden" name="id" value={user.id} />
                  <label className="flex-1 space-y-1 text-sm">
                    <span className="text-neutral-300">Redefinir senha</span>
                    <input
                      name="password"
                      type="password"
                      minLength={8}
                      placeholder="Nova senha (mínimo 8 caracteres)"
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
                    />
                  </label>
                  <button
                    formAction={resetUserPassword}
                    className="rounded-lg border border-neutral-700 px-3 py-2 text-sm"
                  >
                    Redefinir
                  </button>
                </div>
              )}
            </form>
          </section>
        </div>
      )}
    </>
  );
}
