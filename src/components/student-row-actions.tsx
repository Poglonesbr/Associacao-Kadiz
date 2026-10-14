"use client";

import Link from "next/link";
import { Eye, UserX } from "lucide-react";
import { setStudentStatus } from "@/app/actions/alunos";

export function StudentRowActions({
  studentId,
  status,
  canWrite,
}: {
  studentId: string;
  status: string;
  canWrite: boolean;
}) {
  function deactivate() {
    const reason = window.prompt("Informe o motivo do desligamento:");
    if (!reason?.trim()) return;
    if (!window.confirm("Confirmar o desligamento deste aluno?")) return;

    const form = new FormData();
    form.set("id", studentId);
    form.set("status", "DESLIGADO");
    form.set("reason", reason.trim());
    void setStudentStatus(form);
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/alunos/${studentId}`}
        aria-label="Ver ficha"
        title="Ver ficha"
        className="text-emerald-400 hover:text-emerald-300"
      >
        <Eye size={17} />
      </Link>
      {canWrite && status !== "DESLIGADO" && (
        <button
          type="button"
          onClick={deactivate}
          aria-label="Desligar aluno"
          title="Desligar aluno"
          className="text-neutral-400 hover:text-red-400"
        >
          <UserX size={17} />
        </button>
      )}
    </div>
  );
}
