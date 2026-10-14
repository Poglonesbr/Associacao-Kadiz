import { describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import {
  canViewTechnicalArea,
  canViewTechnicalDashboard,
  getTechnicalAreas,
  isTecnico,
  type PermissionUser,
} from "@/lib/permissions";
import { filterTechnicalRows, isAtendidoEligible } from "@/lib/technical-access";

const user = (role: Role, accessPsicologia = false, accessServicoSocial = false): PermissionUser => ({
  id: `${role}-${accessPsicologia}-${accessServicoSocial}`,
  role,
  accessPsicologia,
  accessServicoSocial,
});

describe("technical module access", () => {
  it.each([
    ["PSICOLOGO", true, false],
    ["ASSISTENTE_SOCIAL", false, true],
    ["PROFESSOR", true, false],
    ["ADMIN", false, false],
    ["SECRETARIA", false, false],
  ] as const)("limits %s to its confidentiality grants", (role, psychology, socialWork) => {
    const currentUser = user(role, role === "PROFESSOR" && psychology);

    expect(canViewTechnicalArea(currentUser, "PSICOLOGIA")).toBe(psychology);
    expect(canViewTechnicalArea(currentUser, "SERVICO_SOCIAL")).toBe(socialWork);
    expect(isTecnico(currentUser)).toBe(psychology || socialWork);
  });

  it("allows management roles to see aggregate dashboards, but not confidential records", () => {
    const admin = user("ADMIN");

    expect(canViewTechnicalDashboard(admin, "PSICOLOGIA")).toBe(true);
    expect(canViewTechnicalDashboard(admin, "SERVICO_SOCIAL")).toBe(true);
    expect(getTechnicalAreas(admin)).toEqual([]);
    expect(isTecnico(admin)).toBe(false);
  });

  it("filters evolutions to the areas granted to the current user", () => {
    const rows = [
      { id: "psych", area: "PSICOLOGIA" as const },
      { id: "social", area: "SERVICO_SOCIAL" as const },
    ];

    expect(filterTechnicalRows(rows, user("PSICOLOGO")).map(({ id }) => id)).toEqual(["psych"]);
    expect(filterTechnicalRows(rows, user("ASSISTENTE_SOCIAL")).map(({ id }) => id)).toEqual(["social"]);
  });

  it("only allows Projeto Social students to become Atendidos", () => {
    expect(isAtendidoEligible("PROJETO_SOCIAL")).toBe(true);
    expect(isAtendidoEligible("PARTICULAR")).toBe(false);
  });
});
