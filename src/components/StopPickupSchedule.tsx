import { ArrowLeft, Clock3 } from "lucide-react";
import { getPickupSlots } from "@/data/lineLectureSchedules";
import { useSchedule } from "@/context/ScheduleContext";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type StopPickupScheduleProps = {
  lineId: number;
  stopOrder: number;
  /** Fallback when no structured schedule exists */
  departureTime?: string;
  compact?: boolean;
  /** When set, skips ScheduleContext lookup (avoids re-renders in lists) */
  showOfficeHours?: boolean;
  className?: string;
};

export function StopPickupSchedule({
  lineId,
  stopOrder,
  departureTime,
  compact = false,
  showOfficeHours: showOfficeHoursProp,
  className,
}: StopPickupScheduleProps) {
  const { t } = useI18n();
  const schedule = useSchedule();
  const showOfficeHours = showOfficeHoursProp ?? schedule.settings.showOfficeHours;
  const slots = getPickupSlots(lineId, stopOrder);

  if (!showOfficeHours) return null;

  if (!slots?.length) {
    if (!departureTime) return null;
    return (
      <span
        className={cn(
          "inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-l from-amber-500/20 to-amber-400/5 font-bold text-slate-900 shadow-sm dark:text-amber-100",
          compact ? "px-2.5 py-1 text-sm" : "px-3.5 py-1.5 text-base",
          className,
        )}
      >
        <Clock3 className="size-4 shrink-0 text-amber-500" strokeWidth={2.5} />
        <span className="whitespace-nowrap tabular-nums">{departureTime}</span>
      </span>
    );
  }

  if (compact) {
    return (
      <div
        className={cn(
          "w-full min-w-0 overflow-hidden rounded-xl border border-amber-400/30 bg-gradient-to-b from-amber-500/[0.12] to-amber-400/[0.04]",
          className,
        )}
        dir="rtl"
      >
        <div className="flex items-center gap-1 border-b border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[10px] font-extrabold leading-tight text-amber-900 dark:text-amber-100">
          <Clock3 className="size-3 shrink-0 text-amber-600" />
          <span className="min-w-0">{t.pickupScheduleTitle}</span>
        </div>

        <ul className="divide-y divide-amber-400/15 px-1 py-0.5">
          {slots.map((slot, i) => (
            <li
              key={slot.lectureLabel}
              className={cn(
                "flex items-center justify-between gap-1 px-1.5 py-1",
                i === 0 && "bg-amber-500/[0.08]",
              )}
            >
              <span className="shrink-0 rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-800 dark:bg-slate-900/70 dark:text-amber-200">
                {slot.lectureLabel}
              </span>
              <ArrowLeft className="size-2.5 shrink-0 text-amber-500/75" strokeWidth={2.5} aria-hidden />
              <span className="shrink-0 whitespace-nowrap text-[11px] font-black leading-none tabular-nums text-slate-900 dark:text-white">
                {slot.pickupTime}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-xl border border-amber-400/30 bg-gradient-to-b from-amber-500/[0.12] to-amber-400/[0.04]",
        className,
      )}
      dir="rtl"
    >
      <div className="flex items-center gap-1.5 border-b border-amber-400/20 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-extrabold text-amber-900 sm:text-xs dark:text-amber-100">
        <Clock3 className="size-3.5 shrink-0 text-amber-600" />
        {t.pickupScheduleTitle}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 border-b border-amber-400/15 bg-amber-500/[0.04] px-2.5 py-1 text-[10px] font-bold text-slate-500 sm:text-[11px] dark:text-slate-400">
        <span className="text-end">{t.pickupColumnLecture}</span>
        <span aria-hidden className="w-3.5" />
        <span className="text-start">{t.pickupColumnGathering}</span>
      </div>

      <ul className="divide-y divide-amber-400/15 px-1.5 py-1 sm:px-2">
        {slots.map((slot, i) => (
          <li
            key={slot.lectureLabel}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 px-1.5 py-1.5 sm:px-2 sm:py-2",
              i === 0 && "bg-amber-500/[0.08]",
            )}
          >
            <span className="justify-self-end rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-bold text-amber-800 shadow-sm sm:text-xs dark:bg-slate-900/70 dark:text-amber-200">
              {t.lectureAt(slot.lectureLabel)}
            </span>
            <ArrowLeft
              className="size-3 shrink-0 text-amber-500/80 sm:size-3.5"
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="justify-self-start whitespace-nowrap text-sm font-black tabular-nums text-slate-900 sm:text-base dark:text-white">
              {slot.pickupTime}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
