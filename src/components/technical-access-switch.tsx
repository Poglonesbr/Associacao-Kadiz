"use client";

import { useState } from "react";
import { setConfidentialAccess } from "@/app/actions/usuarios";
import { canViewPsicologia, canViewServicoSocial } from "@/lib/permissions";

type TechnicalUser = Parameters<typeof canViewPsicologia>[0];

export function TechnicalAccessSwitch({
  user,
  flag,
  label,
}: {
  user: TechnicalUser;
  flag: "accessPsicologia" | "accessServicoSocial";
  label: string;
}) {
  const roleGrantsAccess =
    flag === "accessPsicologia"
      ? canViewPsicologia({ ...user, accessPsicologia: false })
      : canViewServicoSocial({ ...user, accessServicoSocial: false });
  const [granted, setGranted] = useState(
    flag === "accessPsicologia"
      ? user.accessPsicologia || roleGrantsAccess
      : user.accessServicoSocial || roleGrantsAccess,
  );

  async function toggle() {
    const next = !granted;
    setGranted(next);
    const form = new FormData();
    form.set("id", user.id);
    form.set("flag", flag);
    form.set("enabled", String(next));
    await setConfidentialAccess(form);
  }

  return (
    <label
      className="flex items-center gap-2 text-xs text-neutral-300"
      title={
        roleGrantsAccess ? "Acesso concedido pelo perfil" : `${granted ? "Revogar" : "Conceder"} acesso a ${label}`
      }
    >
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={granted}
        aria-label={`${label}: ${granted ? "concedido" : "não concedido"}`}
        disabled={roleGrantsAccess}
        onClick={toggle}
        className={`relative h-5 w-9 rounded-full transition ${granted ? "bg-emerald-500" : "bg-neutral-700"} disabled:cursor-not-allowed disabled:opacity-80`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${granted ? "left-[18px]" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}
