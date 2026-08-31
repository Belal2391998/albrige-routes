import { memo, useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bus, Compass } from "lucide-react";
import type { Line } from "@/data/transportData";
import { useSchedule } from "@/context/ScheduleContext";
import { buildLineCardMeta } from "@/lib/buildLineCardMeta";
import { pick, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type NeonTone = {
  badge: string;
  glow: string;
  ring: string;
  soft: string;
  hex: string;
};

const ROUTE_NEON: Record<number, NeonTone> = {
  1: {
    badge: "bg-gradient-to-br from-sky-400 to-blue-600",
    glow: "shadow-[0_0_22px_rgba(56,189,248,0.55)]",
    ring: "ring-sky-400/50",
    soft: "group-hover/route:shadow-[0_0_18px_rgba(56,189,248,0.35)]",
    hex: "#38BDF8",
  },
  2: {
    badge: "bg-gradient-to-br from-amber-300 to-orange-500",
    glow: "shadow-[0_0_22px_rgba(245,158,11,0.55)]",
    ring: "ring-amber-400/50",
    soft: "group-hover/route:shadow-[0_0_18px_rgba(245,158,11,0.35)]",
    hex: "#F59E0B",
  },
  3: {
    badge: "bg-gradient-to-br from-emerald-300 to-teal-600",
    glow: "shadow-[0_0_22px_rgba(16,185,129,0.55)]",
    ring: "ring-emerald-400/50",
    soft: "group-hover/route:shadow-[0_0_18px_rgba(16,185,129,0.35)]",
    hex: "#10B981",
  },
  4: {
    badge: "bg-gradient-to-br from-violet-400 to-purple-700",
    glow: "shadow-[0_0_22px_rgba(167,139,250,0.55)]",
    ring: "ring-violet-400/50",
    soft: "group-hover/route:shadow-[0_0_18px_rgba(167,139,250,0.35)]",
    hex: "#A78BFA",
  },
};

const MOBILE_LITE_MAX = 767;

function useMobileLite() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width: ${MOBILE_LITE_MAX}px)`).matches
      : true,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_LITE_MAX}px)`);
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return mobile;
}

function ActiveTrack() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-14 top-1/2 h-5 w-[calc(100%-7rem)] -translate-y-1/2 overflow-visible"
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="gold-track" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#F59E0B" stopOpacity="1" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path
        d="M 4 10 C 50 2, 150 18, 196 10"
        fill="none"
        stroke="url(#gold-track)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="opacity-90"
      />
      <circle cx="168" cy="8.5" r="3.5" fill="#FBBF24" className="opacity-85" />
    </svg>
  );
}

const RouteMenuItem = memo(
  function RouteMenuItem({
    line,
    title,
    active,
    mobileLite,
    stopsLabel,
    onSelect,
  }: {
    line: Line;
    title: string;
    active: boolean;
    mobileLite: boolean;
    stopsLabel: string;
    onSelect?: () => void;
  }) {
    const neon = ROUTE_NEON[((line.id - 1) % 4) + 1] ?? ROUTE_NEON[1]!;

    const linkClass = cn(
      "group/route relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3",
      mobileLite
        ? "transition-colors duration-150"
        : "transition-all duration-300 hover:-translate-x-1 hover:bg-white/10",
      active
        ? mobileLite
          ? "border-amber-400/50 bg-amber-500/10 ring-1 ring-amber-400/30"
          : "scale-[1.02] border-amber-400/50 bg-amber-500/10 shadow-[0_0_0_1px_rgba(245,158,11,0.25),0_0_28px_rgba(245,158,11,0.22)]"
        : "border-white/5 bg-white/[0.03] hover:border-white/15",
    );

    const content = (
      <>
        {!mobileLite && active ? (
          <>
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-amber-400/40"
              animate={{ opacity: [0.35, 0.85, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <ActiveTrack />
          </>
        ) : null}

        <span
          className={cn(
            "relative z-[1] flex size-11 shrink-0 items-center justify-center rounded-[1.05rem] text-sm font-black text-white",
            neon.badge,
            mobileLite
              ? "ring-1 ring-inset " + neon.ring
              : cn(
                  neon.glow,
                  neon.soft,
                  "ring-1 ring-inset",
                  neon.ring,
                  "transition-shadow duration-300",
                ),
          )}
          style={{ borderRadius: "28% 32% 30% 34% / 34% 28% 36% 30%" }}
        >
          {line.id}
        </span>

        <span className="relative z-[1] min-w-0 flex-1 text-start">
          <span
            className={cn(
              "block truncate text-sm font-bold tracking-tight",
              mobileLite ? "" : "transition-colors duration-300",
              active ? "text-amber-300" : "text-white group-hover/route:text-amber-200",
            )}
          >
            {title}
          </span>
          <span className="mt-0.5 block truncate text-xs font-medium text-slate-400">
            {stopsLabel}
          </span>
        </span>

        <span
          className={cn(
            "relative z-[1] flex size-10 shrink-0 items-center justify-center rounded-xl border",
            mobileLite ? "" : "transition-all duration-300",
            active
              ? mobileLite
                ? "border-amber-400/50 bg-amber-500/15 text-amber-300"
                : "border-amber-400/50 bg-amber-500/15 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.45)]"
              : "border-white/10 bg-white/5 text-slate-500 group-hover/route:border-white/20 group-hover/route:text-slate-300",
          )}
        >
          <Bus
            className="size-4"
            style={
              active && !mobileLite ? { filter: `drop-shadow(0 0 6px ${neon.hex})` } : undefined
            }
          />
        </span>
      </>
    );

    return (
      <Link
        role="menuitem"
        to="/lines/$slug"
        params={{ slug: line.slug }}
        search={{}}
        preload="intent"
        onClick={onSelect}
        aria-current={active ? "page" : undefined}
        className={linkClass}
      >
        {content}
      </Link>
    );
  },
  (prev, next) =>
    prev.line.slug === next.line.slug &&
    prev.active === next.active &&
    prev.mobileLite === next.mobileLite &&
    prev.title === next.title &&
    prev.stopsLabel === next.stopsLabel,
);

export function RoutesMapMenu({
  lines,
  onSelect,
  className,
  compact,
  hideHeader,
}: {
  lines: Line[];
  onSelect?: () => void;
  className?: string;
  compact?: boolean;
  hideHeader?: boolean;
}) {
  const { locale, t } = useI18n();
  const { activeRoutes } = useSchedule();
  const mobileLite = useMobileLite();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeSlug = pathname.startsWith("/lines/") ? pathname.split("/")[2] : undefined;

  const titleBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const meta of buildLineCardMeta(activeRoutes)) {
      map.set(meta.slug, pick(meta.heading, locale));
    }
    return map;
  }, [activeRoutes, locale]);

  return (
    <div
      dir="rtl"
      role="menu"
      className={cn(
        "rounded-3xl border border-white/10 p-4 shadow-2xl",
        mobileLite || compact ? "bg-slate-950" : "bg-slate-900/80 backdrop-blur-xl",
        compact ? "w-full" : "w-[min(22.5rem,calc(100vw-2rem))]",
        className,
      )}
    >
      {!hideHeader && (
        <div className="mb-3 flex items-center gap-2.5 px-1">
          <span className="relative flex size-9 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-300">
            <Compass className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-extrabold tracking-wide text-amber-300/95">
              {t.linesSectionBadge.replace(/^🧭\s*/, "")}
            </p>
            <p className="text-[10px] font-medium text-slate-400">{t.linesNav}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {lines.map((line) => (
          <RouteMenuItem
            key={line.slug}
            line={line}
            title={titleBySlug.get(line.slug) ?? pick(line.title, locale)}
            active={activeSlug === line.slug}
            mobileLite={mobileLite}
            stopsLabel={t.stopsCount(line.stops.length)}
            {...(onSelect ? { onSelect } : {})}
          />
        ))}
      </div>
    </div>
  );
}
