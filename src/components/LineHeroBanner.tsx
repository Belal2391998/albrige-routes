import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Bus, CheckCircle2, Clock3, MapPin } from "lucide-react";
import type { Line, TrafficStatus } from "@/data/transportData";
import { useSchedule } from "@/context/ScheduleContext";
import { pick, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function lineTrafficStatus(line: Line): TrafficStatus {
  const statuses = line.stops.map((s) => s.trafficStatus ?? "clear");
  if (statuses.includes("congested")) return "congested";
  if (statuses.includes("moderate")) return "moderate";
  return "clear";
}

function estimateTripMinutes(line: Line): number {
  const first = line.stops[0]?.departureTime;
  const last = line.stops[line.stops.length - 1]?.departureTime;
  if (first && last) {
    const toMins = (t: string) => {
      const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!m) return null;
      let h = Number(m[1]);
      const min = Number(m[2]);
      const ap = m[3]?.toUpperCase();
      if (ap === "PM" && h < 12) h += 12;
      if (ap === "AM" && h === 12) h = 0;
      return h * 60 + min;
    };
    const a = toMins(first);
    const b = toMins(last);
    if (a != null && b != null && b >= a) return Math.max(5, b - a);
  }
  return Math.max(20, (line.stops.length - 1) * 5);
}

const ROUTE_PATHS = [
  "M -40 300 Q 180 80, 420 210 T 880 150 T 1240 280",
  "M -60 220 Q 240 360, 520 180 T 960 260 T 1280 120",
  "M -20 380 Q 320 240, 600 320 T 1040 200 T 1260 340",
  "M 80 140 Q 360 280, 640 120 T 1080 300 T 1220 180",
];

const ROUTE_NODES: { cx: number; cy: number; delay: string }[] = [
  { cx: 180, cy: 170, delay: "0s" },
  { cx: 420, cy: 210, delay: "0.4s" },
  { cx: 640, cy: 155, delay: "0.8s" },
  { cx: 880, cy: 150, delay: "1.2s" },
  { cx: 320, cy: 300, delay: "0.6s" },
  { cx: 760, cy: 230, delay: "1s" },
  { cx: 1040, cy: 200, delay: "1.4s" },
  { cx: 520, cy: 180, delay: "0.2s" },
];

function TransitRouteGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.14]"
      aria-hidden
    >
      <svg
        viewBox="0 0 1200 420"
        preserveAspectRatio="xMidYMid slice"
        className="animate-hero-route-grid-drift absolute inset-0 size-full"
      >
        <defs>
          <linearGradient id="hero-route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
            <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.55" />
          </linearGradient>
          <filter id="hero-route-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {ROUTE_PATHS.map((d, i) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke="url(#hero-route-grad)"
            strokeWidth={i === 0 ? 1.8 : 1.2}
            strokeLinecap="round"
            strokeDasharray="6 18"
            filter="url(#hero-route-glow)"
            className="animate-route-dash"
            style={{ animationDuration: `${20 + i * 4}s`, animationDelay: `${i * 1.5}s` }}
          />
        ))}

        {ROUTE_NODES.map((node, i) => (
          <g key={`${node.cx}-${node.cy}`}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r="9"
              fill="#22d3ee"
              opacity="0.12"
              className="animate-node-breathe"
              style={{ animationDelay: node.delay }}
            />
            <circle
              cx={node.cx}
              cy={node.cy}
              r="3.5"
              fill={i % 2 === 0 ? "#fbbf24" : "#67e8f9"}
              className="animate-node-breathe"
              style={{ animationDelay: node.delay }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: `${6 + ((i * 17.3) % 88)}%`,
        top: `${10 + ((i * 13.7) % 78)}%`,
        size: i % 4 === 0 ? 2.5 : 1.5,
        tone: i % 2 === 0 ? "bg-amber-300/70" : "bg-cyan-300/60",
        dx: `${((i % 7) - 3) * 4}px`,
        dy: `${-10 - (i % 5) * 4}px`,
        dur: `${12 + (i % 6) * 2.5}s`,
        delay: `${(i * 0.65) % 4}s`,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className={cn("animate-hero-particle absolute rounded-full blur-[0.5px]", p.tone)}
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            ["--hero-dx" as string]: p.dx,
            ["--hero-dy" as string]: p.dy,
            ["--hero-dur" as string]: p.dur,
            ["--hero-delay" as string]: p.delay,
          }}
        />
      ))}
    </div>
  );
}

const metaPillClass =
  "flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 backdrop-blur-md transition-all hover:border-amber-400/40 sm:text-sm";

export function LineHeroBanner({ line }: { line: Line }) {
  const { locale, dir, t } = useI18n();
  const { settings } = useSchedule();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const mins = estimateTripMinutes(line);
  const durationLabel = t.tripDurationApprox(`~${mins}`);
  const traffic = lineTrafficStatus(line);
  const trafficLabel =
    traffic === "congested"
      ? t.routeStatusCongested
      : traffic === "moderate"
        ? t.routeStatusModerate
        : t.routeStatusClear;
  const trafficTone =
    traffic === "congested"
      ? "text-rose-300"
      : traffic === "moderate"
        ? "text-amber-300"
        : "text-emerald-300";
  const trafficIconTone =
    traffic === "congested"
      ? "text-rose-400"
      : traffic === "moderate"
        ? "text-amber-400"
        : "text-emerald-400";

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#081226] via-[#0B1E3D] to-[#060D1A] px-4 py-16 text-center sm:py-20">
      {/* Ambient layers — strictly behind content */}
      <TransitRouteGrid />
      <FloatingParticles />

      <div
        className="pointer-events-none absolute start-1/2 top-[46%] h-[320px] w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(245,158,11,0.16) 0%, rgba(34,211,238,0.1) 38%, transparent 72%)",
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_72%)]"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-[0.06] [mask-image:linear-gradient(to_top,black,transparent)]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 46px, rgba(255,255,255,0.35) 46px 48px), repeating-linear-gradient(0deg, transparent 0 18px, rgba(255,255,255,0.2) 18px 19px)",
          transform: "perspective(400px) rotateX(58deg)",
          transformOrigin: "center bottom",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060D1A] to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
        {/* Back navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/"
            className="group mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 shadow-sm backdrop-blur-md transition-all hover:border-amber-400/40 hover:bg-white/10 hover:text-white sm:text-sm"
          >
            <span>{t.goHome}</span>
            <BackIcon
              className={cn(
                "size-4 text-amber-400 transition-transform",
                dir === "rtl" ? "group-hover:translate-x-1.5" : "group-hover:-translate-x-1.5",
              )}
            />
          </Link>
        </motion.div>

        {/* Line badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.15 }}
          className="animate-hero-badge-pulse mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-1.5 text-xs font-black tracking-wide text-slate-950 sm:text-sm"
        >
          <motion.span
            animate={{ y: [0, -2.5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="flex"
          >
            <Bus className="size-4" />
          </motion.span>
          <motion.span
            animate={{ opacity: [1, 0.84, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            {pick(line.badge, locale)}
          </motion.span>
        </motion.div>

        {/* Monumental title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl font-black tracking-tight text-white drop-shadow-md sm:text-6xl lg:text-7xl"
          style={{ textShadow: "0 0 40px rgba(245, 158, 11, 0.22)" }}
        >
          {pick(line.title, locale)}
        </motion.h1>
        <motion.span
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.4 }}
          className="mt-3 h-1 w-24 origin-center rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_16px_rgba(245,158,11,0.55)]"
          aria-hidden
        />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 max-w-2xl text-sm font-medium text-slate-200/80 sm:text-lg"
        >
          {pick(line.subtitle, locale)}
        </motion.p>

        {/* Meta capsule dock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <div className={metaPillClass}>
            <MapPin className="size-4 shrink-0 text-amber-400" />
            <span>{t.verifiedStops(line.stops.length)}</span>
          </div>
          {settings.showOfficeHours ? (
            <div className={metaPillClass}>
              <Clock3 className="size-4 shrink-0 text-sky-400" />
              <span>{durationLabel}</span>
            </div>
          ) : null}
          <motion.div
            animate={{ opacity: [1, 0.88, 1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            className={cn("animate-hero-traffic-pulse", metaPillClass, trafficTone)}
          >
            <CheckCircle2 className={cn("size-4 shrink-0", trafficIconTone)} />
            <span>{trafficLabel}</span>
          </motion.div>
        </motion.div>

        {settings.showOfficeHours && line.returnDepartures && line.returnDepartures.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-md"
          >
            <p className="mb-2 text-xs font-extrabold tracking-wide text-amber-300/95 sm:text-sm">
              {t.returnDeparturesTitle}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {line.returnDepartures.map((time) => (
                <span
                  key={time}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-1.5 text-sm font-bold tabular-nums text-amber-100"
                >
                  <Clock3 className="size-3.5 shrink-0 text-amber-400" />
                  {time}
                </span>
              ))}
            </div>
            {line.id === 4 ? (
              <p className="mt-2 text-[11px] font-medium text-slate-300/80">
                {t.returnDeparturesSaltNote}
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
