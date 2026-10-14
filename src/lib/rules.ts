export type RequiredDocument = { status: "PENDENTE" | "ENTREGUE" | "APROVADO" | "REJEITADO" };

export function docsComplete(documents: RequiredDocument[]): boolean {
  return documents.length > 0 && documents.every(({ status }) => status === "ENTREGUE" || status === "APROVADO");
}

export function hasDisengagementRisk(absences: { status: string; date: Date }[], year = new Date().getFullYear()): boolean {
  return absences.filter((record) => record.status === "FALTA" && record.date.getFullYear() === year).length >= 3;
}

export function isInvoiceOverdueForTraining(
  invoice: { status: string; dueDate: Date },
  today = new Date(),
): boolean {
  if (invoice.status !== "PENDENTE") return false;
  const due = new Date(invoice.dueDate.getFullYear(), invoice.dueDate.getMonth(), invoice.dueDate.getDate());
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysLate = Math.floor((current.getTime() - due.getTime()) / 86_400_000);
  return daysLate > 10;
}
