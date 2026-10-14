import { describe, expect, it } from "vitest";
import { can, canAccessTurma, canViewPsicologia, canViewServicoSocial } from "./permissions";
import type { PermissionUser } from "./permissions";

const user = (role: PermissionUser["role"], flags: Partial<Pick<PermissionUser, "accessPsicologia" | "accessServicoSocial">> = {}): PermissionUser => ({
  id: "user-1", role, accessPsicologia: false, accessServicoSocial: false, ...flags,
});

describe("permissions matrix", () => {
  it.each(["ADMIN", "COORDENADOR", "SECRETARIA", "PROFESSOR", "PSICOLOGO", "ASSISTENTE_SOCIAL", "FINANCEIRO"] as const)("allows staff %s to view the student list", (role) => {
    expect(can(user(role), "students:view")).toBe(true);
  });
  it.each(["ADMIN", "COORDENADOR", "SECRETARIA"] as const)("allows %s to create and edit students", (role) => {
    expect(can(user(role), "students:write")).toBe(true);
  });
  it.each(["PROFESSOR", "PSICOLOGO", "ASSISTENTE_SOCIAL", "FINANCEIRO"] as const)("denies student editing to %s", (role) => {
    expect(can(user(role), "students:write")).toBe(false);
  });
  it("does not grant confidential access to admins by default", () => {
    const admin = user("ADMIN");
    expect(canViewPsicologia(admin)).toBe(false);
    expect(canViewServicoSocial(admin)).toBe(false);
    expect(can(admin, "psychology")).toBe(false);
    expect(can(admin, "social-work")).toBe(false);
  });
  it("grants confidential access only to the role or audited flags", () => {
    expect(canViewPsicologia(user("PSICOLOGO"))).toBe(true);
    expect(canViewPsicologia(user("SECRETARIA", { accessPsicologia: true }))).toBe(true);
    expect(canViewServicoSocial(user("ASSISTENTE_SOCIAL"))).toBe(true);
    expect(canViewServicoSocial(user("COORDENADOR", { accessServicoSocial: true }))).toBe(true);
  });
  it("enforces the operational role matrix", () => {
    expect(can(user("PROFESSOR"), "attendance")).toBe(true);
    expect(can(user("PROFESSOR"), "attendance:all")).toBe(false);
    expect(can(user("PROFESSOR"), "finance")).toBe(false);
    expect(can(user("FINANCEIRO"), "finance")).toBe(true);
    expect(can(user("SECRETARIA"), "documents")).toBe(true);
    expect(can(user("PSICOLOGO"), "documents")).toBe(false);
    expect(can(user("ADMIN"), "users")).toBe(true);
    expect(can(user("COORDENADOR"), "users")).toBe(false);
    expect(can(user("COORDENADOR"), "referrals:view")).toBe(true);
    expect(can(user("COORDENADOR"), "referrals:write")).toBe(false);
  });
  it("limits professors to their own classes", () => {
    expect(canAccessTurma(user("PROFESSOR"), "user-1")).toBe(true);
    expect(canAccessTurma(user("PROFESSOR"), "someone-else")).toBe(false);
    expect(canAccessTurma(user("SECRETARIA"), "someone-else")).toBe(true);
  });
});
