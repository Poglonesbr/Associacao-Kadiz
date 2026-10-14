import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTecnico: vi.fn(),
  logAccess: vi.fn(),
  revalidatePath: vi.fn(),
  alunoFindUnique: vi.fn(),
  atendidoFindUnique: vi.fn(),
}));

vi.mock("@/lib/guards", () => ({ requireTecnico: mocks.requireTecnico }));
vi.mock("@/lib/audit", () => ({ logAccess: mocks.logAccess }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    aluno: { findUnique: mocks.alunoFindUnique },
    atendido: { findUnique: mocks.atendidoFindUnique },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { createAtendido } from "@/app/actions/atendidos";

describe("createAtendido server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTecnico.mockResolvedValue({
      id: "technical-user",
      role: "PSICOLOGO",
      accessPsicologia: true,
      accessServicoSocial: false,
    });
    mocks.alunoFindUnique.mockResolvedValue({ id: "student-123", vinculo: "PARTICULAR" });
  });

  it("rejects Particular students before looking for or creating a technical record", async () => {
    const form = new FormData();
    form.set("alunoId", "student-123");

    await expect(createAtendido(form)).rejects.toThrow(
      "Somente alunos do Projeto Social podem ter acompanhamento técnico.",
    );
    expect(mocks.atendidoFindUnique).not.toHaveBeenCalled();
    expect(mocks.logAccess).not.toHaveBeenCalled();
  });
});
