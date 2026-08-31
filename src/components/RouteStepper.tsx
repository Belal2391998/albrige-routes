import {
  Component,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { animate, motion, useMotionValue, useMotionValueEvent } from "motion/react";
import { ChevronLeft, ChevronRight, Crosshair, ExternalLink, MapPin } from "lucide-react";
import routeBusMarker from "@/assets/route-bus-marker.png";
import type { Line, Stop, TrafficStatus } from "@/data/transportData";
import { StopPickupSchedule } from "@/components/StopPickupSchedule";
import { useSchedule } from "@/context/ScheduleContext";
import { pick, useI18n } from "@/lib/i18n";
import { openStopInMaps } from "@/lib/mapHelpers";
import { cn } from "@/lib/utils";

function trafficLabel(
  status: TrafficStatus | undefined,
  t: { trafficClear: string; trafficModerate: string; trafficCongested: string },
) {
  if (status === "moderate") return t.trafficModerate;
  if (status === "congested") return t.trafficCongested;
  return t.trafficClear;
}

function trafficTone(status: TrafficStatus | undefined) {
  if (status === "moderate")
    return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (status === "congested")
    return "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
}

export type StopStatus = "active" | "idle";

export const getStopStatus = (index: number, activeIndex: number): StopStatus =>
  index === activeIndex ? "active" : "idle";

const ASPHALT = "#1E293B";
const SPRING = { type: "spring" as const, stiffness: 110, damping: 16, mass: 0.85 };
const SWIPE = 48;
const BUS_SIZE = 44;
/** Below this width: horizontal carousel instead of zigzag road map */
const MOBILE_LAYOUT_MAX = 768;

type RoadPoint = { x: number; y: number };
type StationPose = {
  x: number;
  y: number;
  angle: number;
  side: "left" | "right";
};
type RoadGeometry = {
  d: string;
  width: number;
  height: number;
  cardWidth: number;
  edgePad: number;
  roadClearance: number;
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function reducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Full-width canvas: road centered, cards spread into left/right half-columns.
 */
function buildDiagonalRoad(count: number, width: number): RoadGeometry {
  const n = Math.max(count, 1);
  const narrow = width < MOBILE_LAYOUT_MAX;
  /** Full stop card height incl. schedule table + map button */
  const cardFull = narrow ? 300 : 420;
  const cardHalf = Math.ceil(cardFull / 2);
  /** Vertical gap between adjacent nodes — must exceed card height to avoid overlap */
  const rowGap = cardFull + (narrow ? 28 : 40);
  const padY = (narrow ? 96 : 110) + cardHalf;
  const height = padY * 2 + Math.max(0, n - 1) * rowGap;
  const edgePad = narrow ? 12 : 20;
  const halfCol = width / 2 - edgePad;
  const roadClearance = narrow ? 22 : 36;
  const maxCardWidth = Math.floor(width / 2 - roadClearance - edgePad);
  const cardWidth = narrow
    ? Math.min(Math.floor(halfCol - 6), maxCardWidth)
    : Math.min(280, Math.floor(halfCol * 0.62));
  const cx = width / 2;
  const roadHalf = narrow ? 20 : 30;
  const leftBound = cx - roadHalf;
  const rightBound = cx + roadHalf;
  const amp = narrow ? 14 : 22;
  const startY = padY;
  const endY = height - padY;

  const guides = Math.max(14, n * 3);
  const pts: RoadPoint[] = [];

  for (let i = 0; i < guides; i++) {
    const t = i / (guides - 1);
    const by = startY + (endY - startY) * t;
    const drift = (1 - t) * amp * 0.25 - t * amp * 0.25;
    const wave = Math.sin(t * Math.PI * 2.2) * amp * (0.5 + 0.4 * Math.sin(t * Math.PI));
    const x = Math.min(rightBound, Math.max(leftBound, cx + drift + wave));
    pts.push({ x, y: by });
  }

  let d = `M ${pts[0]!.x.toFixed(2)} ${pts[0]!.y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 5.5;
    const cp1y = p1.y + (p2.y - p0.y) / 5.5;
    const cp2x = p2.x - (p3.x - p1.x) / 5.5;
    const cp2y = p2.y - (p3.y - p1.y) / 5.5;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return {
    d,
    width,
    height,
    cardWidth: Math.max(narrow ? 118 : 128, cardWidth),
    edgePad,
    roadClearance,
  };
}

/** Strict zigzag: 1st left, 2nd right, 3rd left… */
function cardSide(index: number): "left" | "right" {
  return index % 2 === 0 ? "left" : "right";
}

function sampleStations(path: SVGPathElement, total: number): StationPose[] {
  try {
    const len = path.getTotalLength();
    if (!Number.isFinite(len) || len <= 0 || total <= 0) return [];
    const poses: StationPose[] = [];
    for (let i = 0; i < total; i++) {
      const t = total <= 1 ? 0 : i / (total - 1);
      const dist = Math.max(0, Math.min(len, t * len));
      const p1 = path.getPointAtLength(dist);
      const p2 = path.getPointAtLength(Math.min(len, dist + 3));
      const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
      poses.push({
        x: p1.x,
        y: p1.y,
        angle: Number.isFinite(angle) ? angle : 0,
        side: cardSide(i),
      });
    }
    return poses;
  } catch {
    return [];
  }
}

/**
 * Place card at the midpoint of its half-column so wide canvases
 * spread cards into the left/right space instead of bunching center.
 */
function cardLeftWideHalf(
  side: "left" | "right",
  cardWidth: number,
  mapWidth: number,
  edgePad: number,
  roadClearance: number,
) {
  const spine = mapWidth / 2;

  if (side === "left") {
    const mid = (edgePad + spine) / 2;
    const left = mid - cardWidth / 2;
    const maxLeft = spine - roadClearance - cardWidth;
    return Math.max(edgePad, Math.min(left, maxLeft));
  }

  const mid = (spine + mapWidth - edgePad) / 2;
  const left = mid - cardWidth / 2;
  const minLeft = spine + roadClearance;
  return Math.max(minLeft, Math.min(left, mapWidth - edgePad - cardWidth));
}

function useStepperNav(activeIndex: number, total: number, onActiveChange: (i: number) => void) {
  const indexRef = useRef(activeIndex);
  indexRef.current = activeIndex;
  const totalRef = useRef(total);
  totalRef.current = total;

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(totalRef.current - 1, next));
      if (clamped !== indexRef.current) onActiveChange(clamped);
    },
    [onActiveChange],
  );
  const goNext = useCallback(() => goTo(indexRef.current + 1), [goTo]);
  const goPrev = useCallback(() => goTo(indexRef.current - 1), [goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target;
      if (el instanceof HTMLElement) {
        const tag = el.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable)
          return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const origin = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: ReactPointerEvent) => {
    origin.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerCancel = () => {
    origin.current = null;
  };
  const settle = (e: ReactPointerEvent, allowVertical: boolean) => {
    if (!origin.current) return;
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    origin.current = null;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < SWIPE) return;
    if (ax >= ay) {
      if (dx < 0) goNext();
      else goPrev();
      return;
    }
    if (!allowVertical) return;
    if (dy < 0) goNext();
    else goPrev();
  };

  return {
    goTo,
    goNext,
    goPrev,
    dockSwipe: {
      onPointerDown,
      onPointerUp: (e: ReactPointerEvent) => settle(e, true),
      onPointerCancel,
    },
    mapSwipe: {
      onPointerDown,
      onPointerUp: (e: ReactPointerEvent) => settle(e, false),
      onPointerCancel,
    },
  };
}

export function RouteStepper({
  line,
  activeIndex,
  onActiveChange,
  onOpenStop,
}: {
  line: Line;
  activeIndex: number;
  onActiveChange: (i: number) => void;
  onOpenStop: (stop: Stop) => void;
}) {
  const { locale, dir, t } = useI18n();
  const { settings } = useSchedule();
  const [nearest, setNearest] = useState<{ stop: Stop; km: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapWidth, setMapWidth] = useState(() =>
    typeof window !== "undefined" ? Math.max(300, window.innerWidth) : 390,
  );
  const [viewportMobile, setViewportMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width: ${MOBILE_LAYOUT_MAX - 1}px)`).matches
      : true,
  );
  const [pathLength, setPathLength] = useState(0);
  const [stations, setStations] = useState<StationPose[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const pillStripRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const busRef = useRef<HTMLDivElement>(null);
  const pathLengthRef = useRef(0);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const skipScroll = useRef(true);
  const resizeRafRef = useRef<number | null>(null);

  const total = line.stops.length;
  const safeIndex = Math.min(Math.max(0, activeIndex), Math.max(0, total - 1));
  const activeIndexRef = useRef(safeIndex);
  activeIndexRef.current = safeIndex;
  const activeStop = line.stops[safeIndex];
  const completion = total <= 1 ? 100 : Math.round((safeIndex / (total - 1)) * 100);
  const { goTo, goNext, goPrev, dockSwipe, mapSwipe } = useStepperNav(
    safeIndex,
    total,
    onActiveChange,
  );

  const stopDistancesKm = useMemo(() => {
    if (!activeStop) return line.stops.map(() => null as string | null);
    return line.stops.map((stop, i) =>
      i === safeIndex
        ? null
        : haversineKm(activeStop.lat, activeStop.lng, stop.lat, stop.lng).toFixed(1),
    );
  }, [activeStop, line.stops, safeIndex]);

  const road = useMemo(() => buildDiagonalRoad(total, mapWidth), [total, mapWidth]);
  const isMobileLayout = viewportMobile || mapWidth < MOBILE_LAYOUT_MAX;
  const progressMV = useMotionValue(0);
  const roadStroke = mapWidth < 560 ? 26 : 34;

  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const apply = () => {
      const width = Math.max(300, Math.round(el.clientWidth));
      setMapWidth((prev) => (prev === width ? prev : width));
    };
    apply();
    const ro = new ResizeObserver(() => {
      if (resizeRafRef.current != null) return;
      resizeRafRef.current = requestAnimationFrame(() => {
        resizeRafRef.current = null;
        apply();
      });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (resizeRafRef.current != null) cancelAnimationFrame(resizeRafRef.current);
    };
  }, []);

  const applyPose = useCallback((v: number, len: number) => {
    const path = pathRef.current;
    const bus = busRef.current;
    if (!path || !bus || len <= 0) return;
    try {
      const dist = Math.max(0, Math.min(len, v * len));
      const pt = path.getPointAtLength(dist);
      const look = path.getPointAtLength(Math.min(len, dist + 2));
      const angle = (Math.atan2(look.y - pt.y, look.x - pt.x) * 180) / Math.PI;
      bus.style.left = `${pt.x}px`;
      bus.style.top = `${pt.y}px`;
      bus.style.transform = `rotate(${Number.isFinite(angle) ? angle : 0}deg)`;
    } catch (error) {
      console.error("[RouteStepper] failed to pose bus", error);
    }
  }, []);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_LAYOUT_MAX - 1}px)`);
    const apply = () => setViewportMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useLayoutEffect(() => {
    if (isMobileLayout) return;
    const path = pathRef.current;
    if (!path) return;
    try {
      const len = path.getTotalLength();
      pathLengthRef.current = len;
      setPathLength(len);
      setStations(sampleStations(path, total));
    } catch (error) {
      console.error("[RouteStepper] failed to measure route path", error);
    }
  }, [road.d, total, isMobileLayout]);

  useLayoutEffect(() => {
    if (isMobileLayout || pathLength <= 0) return;
    const target = total <= 1 ? 0 : safeIndex / (total - 1);
    progressMV.set(target);
    applyPose(target, pathLength);
  }, [safeIndex, pathLength, total, applyPose, progressMV, isMobileLayout]);

  useEffect(() => {
    if (isMobileLayout || pathLength <= 0) return;
    const target = total <= 1 ? 0 : safeIndex / (total - 1);
    try {
      const controls = animate(
        progressMV,
        target,
        reducedMotion() ? { duration: 0.15 } : { duration: 0.5, ease: [0.42, 0, 0.58, 1] },
      );
      return () => controls.stop();
    } catch (error) {
      console.error("[RouteStepper] bus animation failed", error);
      progressMV.set(target);
      applyPose(target, pathLength);
      return undefined;
    }
  }, [safeIndex, pathLength, progressMV, total, applyPose, isMobileLayout]);

  useMotionValueEvent(progressMV, "change", (v) => {
    applyPose(v, pathLengthRef.current);
  });

  useEffect(() => {
    const el = cardRefs.current[safeIndex];
    if (!el) return;
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }
    el.scrollIntoView({
      behavior: reducedMotion() ? "auto" : "smooth",
      block: isMobileLayout ? "nearest" : "center",
      inline: isMobileLayout ? "center" : "nearest",
    });
  }, [safeIndex, isMobileLayout]);

  useEffect(() => {
    if (!isMobileLayout) return;
    const pill = pillStripRef.current?.querySelector<HTMLElement>(
      `[data-pill-index="${safeIndex}"]`,
    );
    pill?.scrollIntoView({
      behavior: reducedMotion() ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [safeIndex, isMobileLayout, reduceMotion]);

  const observerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isMobileLayout) return;
    const root = carouselRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best: { index: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = Number((entry.target as HTMLElement).dataset["cardIndex"]);
          if (!Number.isFinite(idx)) continue;
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { index: idx, ratio: entry.intersectionRatio };
          }
        }
        if (!best || best.index === activeIndexRef.current) return;
        if (observerDebounceRef.current) clearTimeout(observerDebounceRef.current);
        observerDebounceRef.current = setTimeout(() => {
          skipScroll.current = true;
          onActiveChange(best!.index);
        }, 120);
      },
      { root, threshold: [0.55, 0.7] },
    );

    cardRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });
    return () => {
      observer.disconnect();
      if (observerDebounceRef.current) clearTimeout(observerDebounceRef.current);
    };
  }, [isMobileLayout, line.stops.length, onActiveChange]);

  const findNearest = () => {
    if (!("geolocation" in navigator)) {
      setGeoError(t.geoUnsupported);
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let best = line.stops[0]!;
        let bestKm = Infinity;
        for (const stop of line.stops) {
          const km = haversineKm(pos.coords.latitude, pos.coords.longitude, stop.lat, stop.lng);
          if (km < bestKm) {
            bestKm = km;
            best = stop;
          }
        }
        setNearest({ stop: best, km: bestKm });
        onActiveChange(best.order - 1);
        setLocating(false);
      },
      () => {
        setGeoError(t.geoDenied);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;
  const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  if (!activeStop) {
    return <div className="min-h-[20rem] w-full" aria-hidden />;
  }

  return (
    <div
      ref={shellRef}
      className="relative w-full min-w-full overflow-x-hidden overflow-y-visible bg-transparent transition-colors"
    >
      <div className="relative z-10 w-full min-w-full px-3 sm:px-6 md:px-12">
        <div
          className="w-full max-w-none overflow-x-hidden overflow-y-visible border-y border-slate-200/40 bg-white/45 py-3 backdrop-blur-xl dark:border-slate-800/40 dark:bg-slate-950/40 sm:py-5"
          {...(isMobileLayout ? {} : mapSwipe)}
        >
          <div className="relative z-30 mb-4 flex w-full max-w-none flex-wrap items-center justify-between gap-2 sm:mb-5 sm:gap-3">
            <p className="min-w-0 truncate text-xs font-bold text-slate-500 dark:text-slate-400">
              {t.stopProgress(safeIndex + 1, total, pick(activeStop.name, locale))}
            </p>
            <button
              type="button"
              onClick={findNearest}
              disabled={locating}
              className="relative z-30 flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 disabled:opacity-60"
            >
              <Crosshair className={cn("size-4", locating && "animate-spin")} />
              {locating ? t.locating : t.nearest}
            </button>
          </div>

          {nearest && (
            <p className="relative z-30 mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              {t.nearestResult(pick(nearest.stop.name, locale), nearest.km.toFixed(1))}
            </p>
          )}
          {geoError && (
            <p className="relative z-30 mb-4 rounded-xl border border-destructive/40 px-4 py-2 text-xs text-destructive">
              {geoError}
            </p>
          )}

          {isMobileLayout ? (
            <div className="py-2">
              {/* شريط المحطات — أفقي */}
              <div className="mb-3 px-1">
                <div className="mb-3 h-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-amber-500 transition-all duration-500"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <div
                  ref={pillStripRef}
                  className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <div className="flex min-w-full items-center gap-2 px-1">
                    {line.stops.map((stop, i) => {
                      const active = i === safeIndex;
                      const passed = i < safeIndex;
                      return (
                        <button
                          key={`pill-${stop.id}`}
                          type="button"
                          data-pill-index={i}
                          aria-label={pick(stop.name, locale)}
                          aria-current={active ? "step" : undefined}
                          onClick={() => goTo(i)}
                          className={cn(
                            "inline-flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-2 py-1.5 text-[10px] font-bold transition-all",
                            active
                              ? "z-10 min-w-[4.25rem] border-amber-400 bg-[#0B2265] text-amber-100 shadow-lg shadow-amber-500/25"
                              : passed
                                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "border-slate-200/80 bg-white/90 text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-7 items-center justify-center rounded-full text-[11px] font-black",
                              active
                                ? "bg-amber-400 text-slate-950 ring-2 ring-amber-200/50"
                                : passed
                                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                            )}
                          >
                            {stop.order}
                          </span>
                          <span className="max-w-[4.5rem] truncate leading-tight">
                            {pick(stop.name, locale)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* بطاقات — تمرير أفقي */}
              <div className="relative touch-pan-x">
                <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-4 bg-gradient-to-r from-white/95 to-transparent sm:w-6 dark:from-slate-950/95" />
                <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-4 bg-gradient-to-l from-white/95 to-transparent sm:w-6 dark:from-slate-950/95" />

                <div className="absolute inset-y-0 start-0 z-20 flex items-center ps-0.5">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={safeIndex === 0}
                    aria-label={t.prevStop}
                    className="inline-flex size-7 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-700 shadow-md disabled:opacity-30 sm:size-8 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200"
                  >
                    <PrevIcon className="size-3.5 sm:size-4" />
                  </button>
                </div>
                <div className="absolute inset-y-0 end-0 z-20 flex items-center pe-0.5">
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={safeIndex === total - 1}
                    aria-label={t.nextStop}
                    className="inline-flex size-7 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-700 shadow-md disabled:opacity-30 sm:size-8 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200"
                  >
                    <NextIcon className="size-3.5 sm:size-4" />
                  </button>
                </div>

                <div
                  ref={carouselRef}
                  className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth scroll-px-[2.25rem] px-9 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  dir="ltr"
                >
                  {line.stops.map((stop, i) => {
                    const status = getStopStatus(i, safeIndex);
                    const distKm = stopDistancesKm[i] ?? null;
                    const active = i === safeIndex;
                    return (
                      <div
                        key={`mobile-${stop.id}`}
                        data-card-index={i}
                        ref={(node) => {
                          cardRefs.current[i] = node;
                        }}
                        className={cn(
                          "w-[min(calc(100vw-4.5rem),18.5rem)] shrink-0 snap-center sm:w-[min(calc(100vw-5.5rem),20.5rem)]",
                          active ? "opacity-100" : "opacity-90",
                        )}
                        dir={dir}
                      >
                        <MemoStopCard
                          stop={stop}
                          status={status}
                          distanceKm={distKm}
                          side={cardSide(i)}
                          index={i}
                          compact
                          listLayout
                          reduceMotion={reduceMotion}
                          showOfficeHours={settings.showOfficeHours}
                          onActivate={() => goTo(i)}
                          onOpenDetails={() => {
                            goTo(i);
                            onOpenStop(stop);
                          }}
                          onGoToMaps={() => {
                            goTo(i);
                            openStopInMaps(stop);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="mt-2 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {dir === "rtl" ? "← اسحب لعرض المحطات →" : "→ Swipe to browse stops ←"}
              </p>
            </div>
          ) : (
            <div
              className="relative z-0 touch-pan-y overflow-x-clip overflow-y-visible pb-4 pt-2"
              style={{ height: road.height, minHeight: road.height }}
            >
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                width={road.width}
                height={road.height}
                viewBox={`0 0 ${road.width} ${road.height}`}
                preserveAspectRatio="xMidYMin meet"
                aria-hidden
              >
                {/* Soft terrain wash under the highway */}
                <path
                  d={road.d}
                  fill="none"
                  stroke="rgb(148 163 184 / 0.18)"
                  strokeWidth={roadStroke + 18}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Asphalt highway — uniform, no progress fill */}
                <path
                  d={road.d}
                  fill="none"
                  stroke={ASPHALT}
                  strokeWidth={roadStroke}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={road.d}
                  fill="none"
                  stroke="rgb(51 65 85 / 0.9)"
                  strokeWidth={roadStroke - 8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Center lane markings */}
                <path
                  d={road.d}
                  fill="none"
                  stroke="#F8FAFC"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray="8 12"
                  opacity={0.4}
                />

                {/* Measured path for getPointAtLength */}
                <path ref={pathRef} d={road.d} fill="none" stroke="transparent" strokeWidth={1} />

                {/* Neutral connectors: node → card */}
                {stations.map((pt, i) => {
                  const left = cardLeftWideHalf(
                    pt.side,
                    road.cardWidth,
                    road.width,
                    road.edgePad,
                    road.roadClearance,
                  );
                  const x2 = pt.side === "left" ? left + road.cardWidth : left;
                  return (
                    <g key={`stub-${i}`}>
                      <line
                        x1={pt.x}
                        y1={pt.y}
                        x2={x2}
                        y2={pt.y}
                        stroke="rgb(148 163 184 / 0.35)"
                        strokeWidth={2}
                        strokeDasharray="5 6"
                        strokeLinecap="round"
                      />
                      <circle cx={x2} cy={pt.y} r={2.5} fill="rgb(148 163 184 / 0.55)" />
                    </g>
                  );
                })}
              </svg>

              {/* Stop nodes sampled on the diagonal curve */}
              {stations.map((pt, i) => {
                const stop = line.stops[i];
                if (!stop) return null;
                const status = getStopStatus(i, safeIndex);
                return (
                  <button
                    key={`node-${stop.id}`}
                    type="button"
                    aria-label={pick(stop.name, locale)}
                    onClick={() => goTo(i)}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none"
                    style={{ left: pt.x, top: pt.y }}
                  >
                    <RoadNode status={status} order={stop.order} />
                  </button>
                );
              })}

              {/* Cards spread across left/right half-columns */}
              {stations.map((pt, i) => {
                const stop = line.stops[i];
                if (!stop) return null;
                const status = getStopStatus(i, safeIndex);
                const distKm = stopDistancesKm[i] ?? null;
                const left = cardLeftWideHalf(
                  pt.side,
                  road.cardWidth,
                  road.width,
                  road.edgePad,
                  road.roadClearance,
                );

                return (
                  <div
                    key={`card-${stop.id}`}
                    ref={(node) => {
                      cardRefs.current[i] = node;
                    }}
                    className="absolute scroll-mt-28"
                    style={{
                      left,
                      top: pt.y,
                      width: road.cardWidth,
                      transform: "translateY(-50%)",
                      zIndex: status === "active" ? 30 : 10 + i,
                    }}
                  >
                    <MemoStopCard
                      stop={stop}
                      status={status}
                      distanceKm={distKm}
                      side={pt.side}
                      index={i}
                      compact={mapWidth < 640}
                      reduceMotion={reduceMotion}
                      showOfficeHours={settings.showOfficeHours}
                      onActivate={() => goTo(i)}
                      onOpenDetails={() => {
                        goTo(i);
                        onOpenStop(stop);
                      }}
                      onGoToMaps={() => {
                        goTo(i);
                        openStopInMaps(stop);
                      }}
                    />
                  </div>
                );
              })}

              {/* Bus glides along path to the selected stop */}
              <div
                ref={busRef}
                className="pointer-events-none absolute z-30"
                style={{
                  width: BUS_SIZE,
                  height: BUS_SIZE,
                  marginLeft: -BUS_SIZE / 2,
                  marginTop: -BUS_SIZE / 2,
                  willChange: "transform, left, top",
                }}
              >
                {/* Soft halo + pulse only on the bus */}
                <motion.span
                  className="absolute inset-[-6px] rounded-full bg-amber-400/35 blur-md"
                  animate={
                    reduceMotion
                      ? { opacity: 0.55, scale: 1 }
                      : { opacity: [0.35, 0.75, 0.35], scale: [0.92, 1.12, 0.92] }
                  }
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden
                />
                <motion.span
                  className="absolute inset-0 rounded-full ring-2 ring-amber-400/50"
                  animate={
                    reduceMotion
                      ? { boxShadow: "0 0 12px rgba(245,158,11,0.35)" }
                      : {
                          boxShadow: [
                            "0 0 0 0 rgba(245,158,11,0.45)",
                            "0 0 0 10px rgba(245,158,11,0)",
                            "0 0 0 0 rgba(245,158,11,0.45)",
                          ],
                        }
                  }
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  aria-hidden
                />
                <span className="relative size-11 overflow-hidden rounded-full shadow-xl shadow-amber-500/35 ring-2 ring-white/85 dark:ring-slate-900/70">
                  <img
                    src={routeBusMarker}
                    alt=""
                    draggable={false}
                    className="size-full object-cover"
                  />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "z-40 w-full max-w-none px-3 sm:px-6 md:px-12",
          isMobileLayout
            ? "relative mt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
            : "pointer-events-none fixed inset-x-0 bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6",
        )}
        style={
          isMobileLayout
            ? undefined
            : { background: "linear-gradient(to top, var(--color-background) 50%, transparent)" }
        }
      >
        <div
          {...dockSwipe}
          className="pointer-events-auto mx-auto flex w-full max-w-none flex-col gap-2.5 rounded-2xl border border-white/50 bg-white/80 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80"
        >
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold tracking-wide text-slate-500 dark:text-slate-400">
              {t.tripProgress}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                animate={{ width: `${completion}%` }}
                transition={reduceMotion ? { duration: 0.2 } : SPRING}
              />
            </div>
            <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
              {t.routePercent(completion)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={safeIndex === 0}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <PrevIcon className="size-4" />
              <span className="hidden sm:inline">{t.prevStop}</span>
            </button>
            <p className="min-w-0 flex-1 truncate text-center text-xs font-extrabold text-slate-900 dark:text-white sm:text-sm">
              {t.stopProgress(safeIndex + 1, total, pick(activeStop.name, locale))}
            </p>
            <button
              type="button"
              onClick={goNext}
              disabled={safeIndex === total - 1}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <span className="hidden sm:inline">{t.nextStop}</span>
              <NextIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoadNode({ status, order }: { status: StopStatus; order: number }) {
  const active = status === "active";

  return (
    <span className="relative flex size-9 items-center justify-center">
      <span
        className={cn(
          "relative z-[1] flex items-center justify-center rounded-full border font-bold backdrop-blur-sm transition-colors duration-300",
          active
            ? "size-8 border-amber-400/70 bg-[#0B2265] text-xs text-amber-200 shadow-md shadow-amber-500/15"
            : "size-7 border-slate-300/80 bg-white/80 text-[11px] text-slate-500 dark:border-slate-600 dark:bg-slate-900/75 dark:text-slate-400",
        )}
      >
        {order}
      </span>
    </span>
  );
}

function StopCard({
  stop,
  status,
  distanceKm,
  side,
  index,
  compact,
  listLayout = false,
  reduceMotion = false,
  showOfficeHours,
  onActivate,
  onOpenDetails,
  onGoToMaps,
}: {
  stop: Stop;
  status: StopStatus;
  distanceKm: string | null;
  side: "left" | "right";
  index: number;
  compact?: boolean;
  listLayout?: boolean;
  reduceMotion?: boolean;
  showOfficeHours: boolean;
  onActivate: () => void;
  onOpenDetails: () => void;
  onGoToMaps: () => void;
}) {
  const { locale, dir, t } = useI18n();
  const active = status === "active";
  const fromX = listLayout ? 0 : side === "left" ? -28 : 28;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      initial={reduceMotion || listLayout ? false : { opacity: 0, x: fromX, scale: 0.94 }}
      animate={{
        opacity: active ? 1 : listLayout ? 0.95 : 0.9,
        x: 0,
        scale: listLayout ? 1 : active ? 1.02 : 1,
        y: 0,
      }}
      {...(listLayout || reduceMotion
        ? {}
        : { whileHover: { opacity: 1, scale: active ? 1.05 : 1.02 } })}
      transition={{
        opacity: {
          duration: listLayout ? 0.2 : 0.35,
          delay: listLayout ? 0 : Math.min(index * 0.05, 0.45),
        },
        x: listLayout
          ? { duration: 0.2 }
          : { type: "spring", stiffness: 260, damping: 22, delay: Math.min(index * 0.05, 0.45) },
        scale: listLayout ? { duration: 0.2 } : SPRING,
        y: { duration: 0.3 },
      }}
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden rounded-2xl border backdrop-blur-xl",
        listLayout ? "p-3" : compact ? "p-2" : "p-3 sm:p-3.5",
        active
          ? "z-10 border-amber-400/80 bg-white/95 shadow-xl shadow-amber-500/25 ring-2 ring-amber-500 dark:bg-slate-900/95"
          : "border-slate-200/60 bg-white/80 hover:border-slate-300 dark:border-slate-800/50 dark:bg-slate-900/50 dark:hover:border-slate-700",
        !listLayout && (side === "right" ? "origin-left" : "origin-right"),
      )}
    >
      {active && (
        <>
          <motion.span
            className="pointer-events-none absolute -end-8 -top-8 size-28 rounded-full bg-amber-400/20 blur-2xl"
            animate={
              reduceMotion ? { opacity: 0.5 } : { opacity: [0.35, 0.7, 0.35], scale: [1, 1.12, 1] }
            }
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-amber-400/30"
            aria-hidden
          />
        </>
      )}

      {listLayout ? (
        <div className="flex items-start gap-3" dir={dir}>
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-2xl border font-black",
              active
                ? "border-amber-400/70 bg-[#0B2265] text-sm text-amber-200 shadow-md shadow-amber-500/20"
                : "border-slate-300/80 bg-white/90 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-300",
            )}
          >
            {stop.order}
          </span>
          <div
            role="presentation"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            className="min-w-0 flex-1 text-start"
          >
            <h3 className="text-base font-black leading-snug text-slate-900 dark:text-white">
              {pick(stop.name, locale)}
            </h3>
            <p className="mt-1 flex items-start gap-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs dark:text-slate-400">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
              <span className="line-clamp-2">{pick(stop.landmarkDescription, locale)}</span>
            </p>
          </div>
        </div>
      ) : (
        <>
          <div
            role="presentation"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            className="w-full text-start"
          >
            <h3
              className={cn(
                "font-black leading-snug text-slate-900 dark:text-white",
                compact ? "text-[13px] leading-tight" : "text-base sm:text-lg",
              )}
            >
              {pick(stop.name, locale)}
            </h3>
            <p
              className={cn(
                "mt-1 flex items-start gap-1 font-medium text-slate-500 dark:text-slate-400",
                compact ? "text-[10px] leading-snug" : "text-xs sm:text-sm",
              )}
            >
              <MapPin
                className={cn(
                  "mt-0.5 shrink-0 text-amber-500",
                  compact ? "size-3" : "size-3.5 sm:size-4",
                )}
              />
              <span className={cn(compact ? "line-clamp-3" : "line-clamp-2")}>
                {pick(stop.landmarkDescription, locale)}
              </span>
            </p>
          </div>
        </>
      )}

      <div
        className="mt-2.5 flex w-full min-w-0 flex-col items-stretch gap-1.5 text-start"
        dir="rtl"
      >
        <StopPickupSchedule
          lineId={stop.lineId}
          stopOrder={stop.order}
          departureTime={stop.departureTime}
          compact={listLayout || (compact ?? false)}
          horizontal={false}
          showOfficeHours={showOfficeHours}
          className="w-full"
        />

        <div className="flex flex-wrap items-center gap-1">
          {distanceKm ? (
            <span className="inline-flex items-center rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 sm:px-2 sm:text-xs dark:text-slate-400">
              {t.kmAway(distanceKm)}
            </span>
          ) : null}

          <span
            className={cn(
              "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-xs",
              trafficTone(stop.trafficStatus),
            )}
          >
            {trafficLabel(stop.trafficStatus, t)}
          </span>

          {active && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 sm:px-2 sm:text-xs dark:text-amber-300">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
              </span>
              {t.activeStopTag}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onGoToMaps();
        }}
        className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-xl border border-amber-500/40 bg-gradient-to-l from-amber-500/15 to-amber-400/5 px-2 py-2 text-[10px] font-extrabold leading-snug text-amber-800 shadow-sm transition-colors hover:from-amber-500 hover:to-amber-400 hover:text-slate-950 sm:min-h-11 sm:px-2.5 sm:py-2.5 sm:text-[11px] dark:text-amber-300"
      >
        <ExternalLink className="size-3.5 shrink-0" />
        <span>{t.previewLocation}</span>
      </button>
    </motion.div>
  );
}

const MemoStopCard = memo(StopCard);

type SafeRouteStepperProps = {
  line: Line;
  activeIndex: number;
  onActiveChange: (i: number) => void;
  onOpenStop: (stop: Stop) => void;
};

class StepperErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown) {
    console.error("[RouteStepper] crashed", error);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg px-6 py-16 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          تعذر عرض خريطة المسار. حدّث الصفحة للمحاولة مرة أخرى.
        </div>
      );
    }
    return this.props.children;
  }
}

/** Mounts the map only on the client so SPA navigation never hits SSR/hydration crashes. */
export function SafeRouteStepper(props: SafeRouteStepperProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-[10rem] w-full sm:min-h-[16rem]" aria-hidden />;
  }

  return (
    <StepperErrorBoundary key={props.line.slug}>
      <RouteStepper {...props} />
    </StepperErrorBoundary>
  );
}
