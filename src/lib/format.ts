const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export const formatDate = (d: Date) => dateFmt.format(d);
export const formatDateTime = (d: Date) => dateTimeFmt.format(d);

/** "YYYY-MM-DD" (a stored date string) → "4 May 1990". */
export const formatIsoDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00`));

/** Date-only DB column (UTC midnight) → "YYYY-MM-DD". */
export const dateColumnToIso = (d: Date) => d.toISOString().slice(0, 10);

export const sexLabel: Record<string, string> = { F: "Female", M: "Male", other: "Other" };
