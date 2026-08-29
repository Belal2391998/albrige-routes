import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { MapPinned, Sparkles } from "lucide-react";
import { LineRouteCard } from "@/components/LineRouteCard";
import routesBgBusOriginal from "@/assets/fleet-road.jpg";
import { useSchedule } from "@/context/ScheduleContext";
import { buildLineCardMeta } from "@/lib/buildLineCardMeta";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SHIMMER_STARS = [
  { top: "8%", left: "12%", size: 14, delay: "0s" },
  { top: "14%", left: "78%", size: 11, delay: "0.6s" },
  { top: "22%", left: "44%", size: 9, delay: "1.1s" },
  { top: "34%", left: "90%", size: 12, delay: "0.3s" },
  { top: "48%", left: "6%", size: 10, delay: "1.4s" },
  { top: "56%", left: "62%", size: 13, delay: "0.9s" },
  { top: "68%", left: "28%", size: 8, delay: "1.8s" },
  { top: "74%", left: "84%", size: 11, delay: "0.2s" },
  { top: "82%", left: "52%", size: 10, delay: "1.2s" },
  { top: "90%", left: "18%", size: 12, delay: "0.7s" },
] as const;

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false,
  );

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

function FullBusBackgroundLayer({
  parallaxX,
  parallaxY,
}: {
  parallaxX: ReturnType<typeof useSpring>;
  parallaxY: ReturnType<typeof useSpring>;
}) {
  const isDark = useIsDarkMode();
  const busX = useTransform(parallaxX, (v) => v * 0.5);
  const busY = useTransform(parallaxY, (v) => v * 0.4);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ x: busX, y: busY }}
      aria-hidden
    >
      <motion.img
        key={isDark ? "bus-dark" : "bus-light"}
        src={routesBgBusOriginal}
        alt=""
        className={cn(
          "animate-immersive-bus-glide absolute inset-0 size-full select-none object-cover object-[center_40%]",
          isDark ? "opacity-[0.38]" : "opacity-[0.55]",
        )}
        style={{
          filter: isDark
            ? "saturate(0.85) brightness(0.45) contrast(1.08)"
            : "saturate(1.05) brightness(1.02) contrast(1.02)",
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: isDark ? 0.38 : 0.55,
          scale: [1.04, 1.08, 1.04],
          x: [0, 16, 0],
          y: [0, -8, 0],
        }}
        transition={{
          opacity: { duration: 0.45 },
          scale: { duration: 32, repeat: Infinity, ease: "easeInOut" },
          x: { duration: 32, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 32, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      {isDark ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/75 via-[#0A192F]/45 to-[#0A192F]/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(20,184,166,0.14),transparent_55%)]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-100/55 via-white/35 to-slate-200/50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_25%,rgba(20,184,166,0.12),transparent_55%)]" />
        </>
      )}
    </motion.div>
  );
}

function DataFogLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="animate-immersive-data-fog absolute rounded-full bg-gradient-to-r from-violet-300/20 via-sky-200/15 to-amber-200/20 blur-3xl"
          style={{
            width: `${28 + i * 8}%`,
            height: `${18 + i * 4}%`,
            top: `${12 + i * 14}%`,
            left: `${-8 + i * 16}%`,
            animationDelay: `${i * 2.2}s`,
            animationDuration: `${18 + i * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

function ShimmerStarsLayer() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {SHIMMER_STARS.map((star, i) => (
        <span
          key={i}
          className="animate-immersive-star-shimmer absolute text-amber-200/80"
          style={{
            top: star.top,
            left: star.left,
            fontSize: star.size,
            animationDelay: star.delay,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

type PinPoint = { x: number; y: number };

function GpsTrailOverlay({
  sectionRef,
  pinRefs,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  pinRefs: RefObject<(HTMLSpanElement | null)[]>;
}) {
  const [points, setPoints] = useState<PinPoint[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const measure = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    setSize((prev) => {
      const next = { w: rect.width, h: rect.height };
      return prev.w === next.w && prev.h === next.h ? prev : next;
    });

    const next = pinRefs.current
      .map((el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          x: r.left + r.width / 2 - rect.left,
          y: r.top + r.height / 2 - rect.top,
        };
      })
      .filter(Boolean) as PinPoint[];

    if (next.length >= 2) {
      setPoints((prev) => {
        if (
          prev.length === next.length &&
          prev.every((p, i) => p.x === next[i]!.x && p.y === next[i]!.y)
        ) {
          return prev;
        }
        return next;
      });
    }
  }, [pinRefs, sectionRef]);

  const rafRef = useRef<number | null>(null);
  const scheduleMeasure = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      measure();
    });
  }, [measure]);

  useEffect(() => {
    measure();
    const section = sectionRef.current;
    if (!section) return;

    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(section);
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [measure, scheduleMeasure, sectionRef]);

  if (points.length < 2 || size.w === 0) return null;

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const closedPath = `${pathD} Z`;

  return (
    <svg className="pointer-events-none absolute inset-0 z-[15] size-full" aria-hidden>
      <defs>
        <linearGradient id="gps-trail-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#0ea5e9" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
        </linearGradient>
        <filter id="gps-trail-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d={closedPath}
        fill="none"
        stroke="url(#gps-trail-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="8 14"
        opacity="0.55"
        filter="url(#gps-trail-glow)"
        className="animate-immersive-gps-pulse"
      />

      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r="10"
            fill="#0ea5e9"
            opacity="0.15"
            className="animate-immersive-gps-node"
            style={{ animationDelay: `${i * 0.35}s` }}
          />
          <circle
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#fbbf24"
            className="animate-immersive-gps-node"
            style={{ animationDelay: `${i * 0.35}s` }}
          />
        </g>
      ))}
    </svg>
  );
}

export function RoutesImmersiveSection() {
  const { t } = useI18n();
  const isDark = useIsDarkMode();
  const { activeRoutes } = useSchedule();
  const lineCardMeta = buildLineCardMeta(activeRoutes);
  const sectionRef = useRef<HTMLElement>(null);
  const pinRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-18, 18]), {
    stiffness: 40,
    damping: 20,
  });
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-12, 12]), {
    stiffness: 40,
    damping: 20,
  });

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      ref={sectionRef}
      id="lines"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn(
        "relative isolate min-h-[980px] overflow-hidden rounded-t-[1.75rem] border-t py-16 sm:min-h-[1040px] sm:rounded-t-[2.25rem] sm:py-20 lg:rounded-t-[2.75rem]",
        isDark ? "border-white/10 bg-[#0A192F]" : "border-slate-200/80 bg-slate-100",
      )}
    >
      <FullBusBackgroundLayer parallaxX={parallaxX} parallaxY={parallaxY} />
      <DataFogLayer />
      <ShimmerStarsLayer />
      <GpsTrailOverlay sectionRef={sectionRef} pinRefs={pinRefs} />

      <motion.div
        className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className={cn(
              "mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold tracking-wide sm:text-xs",
              isDark
                ? "border-[#14B8A6]/35 bg-[#0A192F]/65 text-[#99f6e4] backdrop-blur-md"
                : "border-[#14B8A6]/35 bg-white/80 text-[#0A192F] backdrop-blur-md",
            )}
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#14B8A6] opacity-55" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[#14B8A6]" />
            </span>
            {t.linesSectionBadge.replace(/^🧭\s*/, "")}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className={cn(
              "text-balance text-3xl font-extrabold leading-[1.25] tracking-tight sm:text-4xl lg:text-[2.75rem]",
              isDark ? "text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]" : "text-[#0A192F]",
            )}
          >
            {t.linesSectionTitle}
          </motion.h2>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mx-auto mt-4 flex h-3 w-28 items-center justify-center origin-center"
            aria-hidden
          >
            <span className="h-px w-full bg-gradient-to-r from-transparent via-[#14B8A6] to-transparent" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className={cn(
              "mx-auto mt-4 max-w-2xl text-pretty text-sm font-medium leading-7 sm:text-base",
              isDark
                ? "text-slate-200/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]"
                : "text-slate-600",
            )}
          >
            {t.linesSectionLead}
          </motion.p>
        </div>

        <div className="relative grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-8 lg:gap-9">
          {lineCardMeta.map((meta, i) => (
            <div key={meta.slug} className="relative">
              <span
                ref={(el) => {
                  pinRefs.current[i] = el;
                }}
                className="pointer-events-none absolute -top-1 end-4 z-20 inline-flex size-9 items-center justify-center rounded-full border border-[#14B8A6]/35 bg-[#0A192F]/85 text-[#14B8A6] shadow-[0_0_14px_rgba(20,184,166,0.25)] backdrop-blur-sm sm:size-10"
                aria-hidden
              >
                <MapPinned className="size-4 sm:size-[1.15rem] animate-immersive-gps-node" />
              </span>
              <LineRouteCard meta={meta} index={i} immersive />
            </div>
          ))}
        </div>

        <motion.div
          className="pointer-events-none absolute -top-4 end-[10%] text-[#14B8A6]/45"
          animate={{ opacity: [0.25, 0.7, 0.25], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          <Sparkles className="size-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
