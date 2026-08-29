import { ArrowLeft, Clock3 } from "lucide-react";
import { getPickupSlots } from "@/data/lineLectureSchedules";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type StopPickupScheduleProps = {
  lineId: number;
  stopOrder: number;
  /** Fallback when no structured schedule exists */
  departureTime?: string;
  compact?: boolean;
  className?: string;
};

export function StopPickupSchedule({
  lineId,
  stopOrder,
  departureTime,
  compact = false,
  className,
}: StopPickupScheduleProps) {
  const { t } = useI18n();
  const slots = getPickupSlots(lineId, stopOrder);

  if (!slots?.length) {
    if (!departureTime) return null;
    return (
      <span
        className={cn(
          "inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-l from-amber-500/20 to-amber-400/5 font-bold text-slate-900 shadow-sm dark:text-amber-100",
          compact ? "px-2.5 py-1 text-sm" : "px-3.5 py-1.5 text-base",
          className,
        )}
      >
        <Clock3 className="size-4 shrink-0 text-amber-500" strokeWidth={2.5} />
        <span className="tabular-nums">{departureTime}</span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-amber-400/30 bg-gradient-to-b from-amber-500/[0.12] to-amber-400/[0.04]",
        className,
      )}
      dir="rtl"
    >
      <div
        className={cn(
          "flex items-center gap-1.5 border-b border-amber-400/20 bg-amber-500/10 px-2.5 font-extrabold text-amber-900 dark:text-amber-100",
          compact ? "py-1 text-[10px]" : "py-1.5 text-[11px] sm:text-xs",
        )}
      >
        <Clock3 className={cn("shrink-0 text-amber-600", compact ? "size-3" : "size-3.5")} />
        {t.pickupScheduleTitle}
      </div>

      <div
        className={cn(
          "grid grid-cols-[1fr_auto_1fr] items-center gap-1 border-b border-amber-400/15 bg-amber-500/[0.04] px-2 font-bold text-slate-500 dark:text-slate-400",
          compact ? "py-0.5 text-[9px]" : "py-1 text-[10px] sm:text-[11px]",
        )}
      >
        <span className="text-end">{t.pickupColumnLecture}</span>
        <span aria-hidden className="w-4" />
        <span className="text-start">{t.pickupColumnGathering}</span>
      </div>

      <ul className={cn("divide-y divide-amber-400/15", compact ? "px-1 py-0.5" : "px-1.5 py-1")}>
        {slots.map((slot, i) => (
          <li
            key={slot.lectureLabel}
            className={cn(
              "grid grid-cols-[1fr_auto_1fr] items-center gap-1",
              compact ? "px-1.5 py-1" : "px-2 py-1.5",
              i === 0 && "bg-amber-500/[0.08]",
            )}
          >
            <span
              className={cn(
                "justify-self-end rounded-md bg-white/80 px-2 py-0.5 font-bold text-amber-800 shadow-sm dark:bg-slate-900/70 dark:text-amber-200",
                compact ? "text-[10px]" : "text-[11px] sm:text-xs",
              )}
            >
              {t.lectureAt(slot.lectureLabel)}
            </span>
            <ArrowLeft
              className={cn("shrink-0 text-amber-500/80", compact ? "size-3" : "size-3.5")}
              strokeWidth={2.5}
              aria-hidden
            />
            <span
              className={cn(
                "justify-self-start font-black tabular-nums text-slate-900 dark:text-white",
                compact ? "text-xs" : "text-sm sm:text-base",
              )}
            >
              {slot.pickupTime}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
