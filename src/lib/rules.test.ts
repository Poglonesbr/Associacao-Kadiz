import { describe, expect, it } from "vitest";
import { docsComplete, hasDisengagementRisk, isInvoiceOverdueForTraining } from "./rules";

describe("student and billing rules", () => {
  it("requires every document to be delivered or approved", () => {
    expect(docsComplete([{ status: "ENTREGUE" }, { status: "APROVADO" }])).toBe(true);
    expect(docsComplete([{ status: "ENTREGUE" }, { status: "PENDENTE" }])).toBe(false);
    expect(docsComplete([])).toBe(false);
  });

  it("raises a social-project risk after three unjustified absences in the selected calendar year", () => {
    const records = [1, 2, 3].map((day) => ({ status: "FALTA", date: new Date(2026, 4, day) }));
    expect(hasDisengagementRisk(records, 2026)).toBe(true);
    expect(hasDisengagementRisk(records.slice(0, 2), 2026)).toBe(false);
    expect(hasDisengagementRisk([...records, { status: "FALTA_JUSTIFICADA", date: new Date(2026, 4, 4) }], 2026)).toBe(true);
    expect(hasDisengagementRisk(records, 2025)).toBe(false);
  });

  it("blocks only pending invoices more than ten days overdue", () => {
    const today = new Date(2026, 4, 21);
    expect(isInvoiceOverdueForTraining({ status: "PENDENTE", dueDate: new Date(2026, 4, 10) }, today)).toBe(true);
    expect(isInvoiceOverdueForTraining({ status: "PENDENTE", dueDate: new Date(2026, 4, 11) }, today)).toBe(false);
    expect(isInvoiceOverdueForTraining({ status: "PAGO", dueDate: new Date(2026, 4, 1) }, today)).toBe(false);
  });
});
