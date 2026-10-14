export function getCategory(birthDate: Date, today = new Date()): string {
  const age = getAge(birthDate, today);
  const categoryAge = age % 2 === 0 ? age : age + 1;
  return `Sub-${categoryAge}`;
}

export function getAge(birthDate: Date, today = new Date()): number {
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age;
}
