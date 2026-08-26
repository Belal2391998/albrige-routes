import { Suspense, lazy } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Clock3, MapPin, Navigation, X } from "lucide-react";
import type { Stop, TrafficStatus } from "@/data/transportData";
import { pick, useI18n } from "@/lib/i18n";
import { stopNavigationUrl } from "@/lib/mapHelpers";
import { cn } from "@/lib/utils";

const MiniMap = lazy(() => import("./MiniMap"));

function trafficLabel(
  status: TrafficStatus | undefined,
  t: { trafficClear: string; trafficModerate: string; trafficCongested: string },
) {
  if (status === "moderate") return t.trafficModerate;
  if (status === "congested") return t.trafficCongested;
  return t.trafficClear;
}

function trafficTone(status: TrafficStatus | undefined) {
  if (status === "moderate") return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (status === "congested") return "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
}

export function StopModal({
  stop,
  color,
  onClose,
}: {
  stop: Stop | null;
  color: string;
  onClose: () => void;
}) {
  const { locale, t } = useI18n();

  return (
    <AnimatePresence>
      {stop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="glass max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-4 shadow-elegant"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <span
                  className="mb-1 inline-block rounded-full px-3 py-1 text-[11px] font-bold text-primary-foreground"
                  style={{ backgroundColor: color }}
                >
                  {t.stopNumber(stop.order)}
                </span>
                <h3 className="text-xl font-extrabold text-foreground">{pick(stop.name, locale)}</h3>
              </div>
              <button onClick={onClose} aria-label={t.close} className="text-muted-foreground">
                <X className="size-5" />
              </button>
            </div>

            <motion.img
              key={stop.id}
              src={stop.imageUrl}
              alt={t.stopPhoto(pick(stop.name, locale))}
              loading="lazy"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
              className="h-48 w-full rounded-2xl object-cover"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-bold text-foreground">
                <Clock3 className="size-3.5 text-amber-500" />
                {stop.departureTime}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
                  trafficTone(stop.trafficStatus),
                )}
              >
                {trafficLabel(stop.trafficStatus, t)}
              </span>
            </div>

            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" style={{ color }} />
              {pick(stop.landmarkDescription, locale)}
            </p>

            {stop.adminNote ? (
              <p className="mt-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm font-medium text-foreground">
                {stop.adminNote}
              </p>
            ) : null}

            <div className="mt-3 overflow-hidden rounded-2xl border border-border">
              <Suspense fallback={<div className="h-48 w-full animate-pulse bg-secondary" />}>
                <MiniMap
                  lat={stop.lat}
                  lng={stop.lng}
                  color={color}
                  mapsUrl={stopNavigationUrl(stop)}
                />
              </Suspense>
            </div>

            <motion.a
              href={stopNavigationUrl(stop)}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="animate-shine mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-extrabold text-accent-foreground shadow-gold"
            >
              <Navigation className="size-4" />
              {t.mapsCta}
            </motion.a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
