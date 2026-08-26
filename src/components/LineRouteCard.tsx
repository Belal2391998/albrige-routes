import { useRef, useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LineCardMeta } from "@/data/transportData";
import { pick, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LineRouteCardProps = {
  meta: LineCardMeta;
  index: number;
  immersive?: boolean;
};

export function LineRouteCard({ meta, index, immersive = false }: LineRouteCardProps) {
  const { locale, dir } = useI18n();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [9, -9]), {
    stiffness: 260,
    damping: 28,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), {
    stiffness: 260,
    damping: 28,
  });
  const glareX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);
  const glareBackground = useMotionTemplate`radial-gradient(420px circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.22), transparent 55%)`;

  const ArrowIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const resetTilt = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
      className="relative"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={resetTilt}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          boxShadow: hovered
            ? `0 12px 28px -18px ${meta.shadowTint}`
            : undefined,
        }}
        animate={{
          y: hovered ? -6 : 0,
          scale: hovered ? 1.03 : 1,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className={cn(
          "group relative overflow-hidden rounded-2xl border shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md",
          immersive
            ? "min-h-[8.5rem] border-white/40 bg-white/45 p-7 backdrop-blur-lg hover:bg-white/55 sm:min-h-[9rem] sm:p-8 dark:border-white/20 dark:bg-white/10"
            : "border-slate-200/60 bg-white/80 p-6 dark:border-slate-700/50 dark:bg-slate-900/70",
        )}
      >
        <div
          className="pointer-events-none absolute -end-20 -top-20 h-44 w-44 rounded-full bg-gradient-to-br from-amber-300/40 to-[#0A2240]/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
          aria-hidden
        />

        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-inset ring-[#0A2240]/20 transition-opacity duration-500 group-hover:opacity-100 dark:ring-amber-400/35"
          aria-hidden
        />

        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glareBackground }}
          aria-hidden
        />

        <Link
          to="/lines/$slug"
          params={{ slug: meta.slug }}
          search={{}}
          className={cn(
            "relative z-10 flex items-center",
            immersive ? "gap-5 sm:gap-6" : "gap-4",
          )}
          style={{ transform: "translateZ(24px)" }}
        >
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className={cn(
              "relative shrink-0 overflow-hidden rounded-2xl shadow-md ring-2 ring-white/50 dark:ring-white/10",
              immersive ? "size-[4.5rem] sm:size-20" : "size-14",
              meta.iconBg,
            )}
            style={{ transform: "translateZ(36px)" }}
          >
            <motion.img
              src={meta.busImage}
              alt=""
              animate={hovered ? { scale: 1.12, x: -2 } : { scale: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
            <span
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0A2240]/25 to-transparent opacity-40"
              aria-hidden
            />
          </motion.div>

          <div className="min-w-0 flex-1 text-start">
            <span
              className={cn(
                "mb-2.5 inline-block rounded-md font-bold",
                immersive ? "px-3 py-1.5 text-sm sm:text-base" : "px-2.5 py-1 text-xs",
                meta.badgeStyle,
              )}
            >
              {pick(meta.badgeText, locale)}
            </span>
            <h3
              className={cn(
                "font-bold text-[#0A2240] transition-colors group-hover:text-[#0A2240] dark:text-white dark:group-hover:text-white",
                immersive ? "text-xl sm:text-2xl" : "text-xl",
              )}
            >
              {pick(meta.heading, locale)}
            </h3>
            <p
              className={cn(
                "mt-1.5 font-medium text-slate-600 dark:text-slate-400",
                immersive
                  ? "line-clamp-2 text-sm leading-relaxed sm:text-base"
                  : "line-clamp-1 text-sm sm:line-clamp-2",
              )}
            >
              {pick(meta.pathSnippet, locale)}
            </p>
          </div>

          <motion.div
            animate={hovered ? { x: dir === "rtl" ? 6 : -6 } : { x: 0 }}
            transition={
              hovered
                ? { repeat: Infinity, duration: 0.8, repeatType: "reverse", ease: "easeInOut" }
                : { type: "spring", stiffness: 300, damping: 22 }
            }
            className={cn(
              "flex shrink-0 items-center justify-center rounded-xl bg-white/80 text-[#0A2240] shadow-sm ring-1 ring-[#0A2240]/10 transition-colors group-hover:bg-[#0A2240] group-hover:text-amber-300 dark:bg-slate-800 dark:text-slate-200",
              immersive ? "size-12 sm:size-14" : "size-10",
            )}
          >
            <ArrowIcon className={cn(immersive ? "size-6" : "size-5")} />
          </motion.div>
        </Link>

        <div
          className="pointer-events-none absolute inset-x-6 bottom-0 h-0.5 origin-center scale-x-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent transition-transform duration-500 group-hover:scale-x-100"
          aria-hidden
        />
      </motion.div>
    </motion.div>
  );
}
