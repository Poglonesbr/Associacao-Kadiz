export type FollowUpRecord = {
  status: string;
  ingressoDate: Date;
  closeDate: Date | null;
  nextReviewDate: Date | null;
  closeType: string | null;
};

export function getPiaReviewHealth(records: FollowUpRecord[], today = new Date()) {
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const active = records.filter((record) => record.status === "ATIVO");
  const updated = active.filter((record) => record.nextReviewDate && record.nextReviewDate >= currentDate).length;
  const overdue = active.filter((record) => record.nextReviewDate && record.nextReviewDate < currentDate).length;
  const withoutDate = active.filter((record) => !record.nextReviewDate).length;
  return {
    active: active.length,
    updated,
    overdue,
    withoutDate,
    percent: active.length ? Math.round((updated / active.length) * 100) : 0,
  };
}

export function averageFollowUpMonths(records: FollowUpRecord[], today = new Date()): number {
  if (!records.length) return 0;
  const total = records.reduce((sum, record) => {
    const end = record.closeDate ?? today;
    return sum + Math.max(0, (end.getTime() - record.ingressoDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));
  }, 0);
  return total / records.length;
}

export function groupExitsByType(records: FollowUpRecord[]): Record<string, number> {
  return records.reduce<Record<string, number>>((groups, record) => {
    if (record.status === "ENCERRADO" && record.closeType)
      groups[record.closeType] = (groups[record.closeType] ?? 0) + 1;
    return groups;
  }, {});
}
