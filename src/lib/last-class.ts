/** My classes reopens the class and semester a teacher last worked in, read on the server so the page never jumps. */
export const lastClassCookie = "riverbay-last-class";

export function rememberLastClass(periodId: string, classId: string) {
  if (!periodId || !classId) return;
  document.cookie = `${lastClassCookie}=${periodId}.${classId}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function readLastClass(value: string | undefined): { period?: string; class?: string } {
  const [period, classId] = value?.split(".") ?? [];
  return period && classId ? { period, class: classId } : {};
}
