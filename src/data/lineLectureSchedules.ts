/** Morning pickup times per stop in 24h H:MM — one slot (8:30 only), two, or three lectures */
export type LectureTimes = [string] | [string, string] | [string, string, string];

export type PickupSlot = {
  lectureLabel: string;
  pickupTime: string;
};

const LECTURE_LABELS_3 = ["8:30", "10:00", "11:30"] as const;
const LECTURE_LABELS_2 = ["8:30", "10:00"] as const;
const LECTURE_LABELS_1 = ["8:30"] as const;

export function getPickupSlots(lineId: number, stopOrder: number): PickupSlot[] | null {
  const times = lectureSchedulesByLineId[lineId]?.[stopOrder - 1];
  if (!times) return null;
  const labels =
    times.length === 3
      ? LECTURE_LABELS_3
      : times.length === 2
        ? LECTURE_LABELS_2
        : LECTURE_LABELS_1;
  return times.map((t, i) => ({
    lectureLabel: labels[i] ?? `${i + 1}`,
    pickupTime: toDisplayTime(t),
  }));
}

/** Campus return departures (24h H:MM) — from university back to the line */
export const returnDeparturesByLineId: Record<number, string[]> = {
  1: ["11:40", "13:10", "14:40", "16:40"],
  2: ["11:40", "13:10", "14:40", "16:40"],
  3: ["11:40", "13:10", "14:40", "16:40"],
  4: ["14:40"],
  5: ["16:40"],
};

export const lectureSchedulesByLineId: Record<number, LectureTimes[]> = {
  // خط أبو نصير
  1: [
    ["6:50", "8:00", "9:45"],
    ["6:55", "8:05", "9:50"],
    ["7:05", "8:15", "10:00"],
    ["7:10", "8:25", "10:05"],
    ["7:25", "8:45", "10:15"],
    ["7:25", "8:45", "10:15"],
    ["7:30", "8:55", "10:20"],
    ["7:32", "8:57", "10:22"],
    ["7:35", "9:00", "10:25"],
    ["7:40", "9:10", "10:30"],
  ],
  // خط الاستشارات
  2: [
    ["7:00", "8:20", "9:45"],
    ["7:05", "8:25", "9:55"],
    ["7:10", "8:30", "10:00"],
    ["7:13", "8:35", "10:03"],
    ["7:20", "8:50", "10:10"],
    ["7:25", "8:55", "10:15"],
    ["7:35", "9:05", "10:25"],
    ["7:38", "9:08", "10:28"],
    ["7:40", "9:10", "10:30"],
  ],
  // خط عريفة مول
  3: [
    ["6:55", "8:15", "9:45"],
    ["7:00", "8:20", "9:50"],
    ["7:10", "8:35", "10:05"],
    ["7:15", "8:45", "10:15"],
    ["7:20", "8:50", "10:20"],
    ["7:25", "8:55", "10:20"],
    ["7:30", "9:00", "10:25"],
    ["7:35", "9:05", "10:30"],
    ["7:45", "9:15", "10:40"],
    ["7:50", "9:20", "10:45"],
    ["7:55", "9:25", "10:50"],
  ],
  // خط السلط (محاضرتان فقط)
  4: [
    ["6:30", "7:45"],
    ["6:30", "7:50"],
    ["6:35", "7:50"],
    ["6:35", "7:50"],
    ["6:40", "7:55"],
    ["6:45", "8:00"],
    ["6:45", "8:00"],
    ["6:50", "8:10"],
    ["6:55", "8:15"],
    ["7:00", "8:20"],
    ["7:00", "8:25"],
  ],
  // خط سحاب / جنوب عمّان — محاضرة 8:30 (وقت تجمع واحد لكل محطة)
  5: [
    ["7:40"], // الرجيب (بداية الخط)
    ["7:45"], // إشارة مدخل سحاب
    ["6:50"], // صيدلية تلال
    ["6:55"], // البنك الإسلامي (جسر أبو علندا)
    ["7:00"], // دوار الجمرك
    ["7:55"], // دوار الحوiyan
    ["7:05"], // إشارة أبو زغلة
    ["7:10"], // إشارة الحفاظ
    ["7:15"], // تقاطع الإرسال
    ["7:20"], // إشارة حي الصحابة
    ["7:25"], // دوار قرقش
    ["7:30"], // دوار الياسمين
  ],
};

export function toDisplayTime(t: string): string {
  const match = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return t;
  let h = Number(match[1]);
  const m = match[2]!;
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
}

/** @deprecated Use toDisplayTime */
export const toAmTime = toDisplayTime;

export function getReturnDepartures(lineId: number): string[] {
  return (returnDeparturesByLineId[lineId] ?? []).map(toDisplayTime);
}

export function returnDeparturesNote(lineId: number): string {
  return getReturnDepartures(lineId).join(" | ");
}

export function lectureScheduleNote(times: LectureTimes): string {
  if (times.length === 1) return `محاضرة 8:30 → ${toDisplayTime(times[0])}`;
  const labels = times.length === 3 ? (["10:00", "11:30"] as const) : (["10:00"] as const);
  return times
    .slice(1)
    .map((t, i) => `محاضرة ${labels[i]} → ${toDisplayTime(t)}`)
    .join(" | ");
}
