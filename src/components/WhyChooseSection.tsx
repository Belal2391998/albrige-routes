import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Armchair, Clock3, MapPinned, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type FeatureCard = {
  id: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  accent: "navy" | "teal";
  curve: "start" | "end";
  bar: string;
};

function TransitCurvesBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full opacity-[0.07]"
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="why-route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0A192F" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#14B8A6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0A192F" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        d="M -40 420 Q 280 180, 560 340 T 1120 260 T 1480 380"
        fill="none"
        stroke="url(#why-route-grad)"
        strokeWidth="1.5"
        strokeDasharray="8 16"
        className="animate-route-dash"
      />
      <path
        d="M -20 520 Q 360 360, 720 480 T 1320 320"
        fill="none"
        stroke="url(#why-route-grad)"
        strokeWidth="1.2"
        strokeDasharray="6 20"
        className="animate-route-dash"
        style={{ animationDuration: "26s" }}
      />
      <path
        d="M 80 140 Q 420 280, 780 160 T 1380 240"
        fill="none"
        stroke="url(#why-route-grad)"
        strokeWidth="1"
        strokeDasharray="5 18"
        className="animate-route-dash"
        style={{ animationDuration: "30s", animationDelay: "2s" }}
      />
    </svg>
  );
}

function GlowSquircle({ icon: Icon, accent }: { icon: LucideIcon; accent: FeatureCard["accent"] }) {
  const isNavy = accent === "navy";

  return (
    <motion.span
      className={cn(
        "relative inline-flex size-[3.75rem] items-center justify-center rounded-[1.35rem]",
        "ring-1 ring-white/90 transition-shadow duration-300 group-hover:shadow-[0_0_32px_-4px_var(--glow)]",
        isNavy
          ? "bg-gradient-to-br from-[#0A192F] to-[#0f2744] text-[#14B8A6] [--glow:rgba(20,184,166,0.45)]"
          : "bg-gradient-to-br from-[#14B8A6] to-teal-500 text-[#0A192F] [--glow:rgba(10,25,47,0.3)]",
      )}
      style={{
        boxShadow: isNavy
          ? "0 12px 28px -10px rgba(10,25,47,0.4), 0 0 0 1px rgba(255,255,255,0.5) inset"
          : "0 12px 28px -10px rgba(20,184,166,0.4), 0 0 0 1px rgba(255,255,255,0.55) inset",
      }}
      whileHover={{ scale: 1.1, rotate: [0, -4, 4, 0] }}
      transition={{
        rotate: { duration: 0.55, ease: "easeInOut" },
        scale: { type: "spring", stiffness: 320, damping: 18 },
      }}
      aria-hidden
    >
      <Icon className="size-[1.35rem]" strokeWidth={2.25} />
    </motion.span>
  );
}

function FeatureGlassCard({ card, index }: { card: FeatureCard; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), {
    stiffness: 260,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), {
    stiffness: 260,
    damping: 22,
  });

  const handleMove = (e: React.PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const resetTilt = () => {
    mx.set(0);
    my.set(0);
  };

  const curveStart = card.curve === "start";

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{
        type: "spring",
        stiffness: 180,
        damping: 22,
        delay: 0.1 + index * 0.1,
      }}
      style={{ rotateX, rotateY, transformPerspective: 1100 }}
      onPointerMove={handleMove}
      onPointerLeave={resetTilt}
      className={cn(
        "group relative flex min-h-[280px] w-[min(86vw,320px)] shrink-0 snap-center flex-col sm:w-auto sm:min-w-0 sm:shrink",
        "overflow-hidden rounded-3xl border border-white/70 bg-white/85 backdrop-blur-xl",
        "shadow-2xl shadow-blue-950/5",
        "transition-[box-shadow,border-color] duration-300",
        "hover:-translate-y-2.5 hover:border-teal-300/50 hover:shadow-[0_32px_64px_-24px_rgba(10,25,47,0.14)]",
        curveStart
          ? "rounded-ss-[3.25rem] rounded-ee-[1.75rem]"
          : "rounded-se-[3.25rem] rounded-es-[1.75rem]",
      )}
    >
      {/* Top accent bar */}
      <div
        className={cn("absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r opacity-90", card.bar)}
        aria-hidden
      />

      {/* Corner accent */}
      <div
        className={cn(
          "pointer-events-none absolute size-24 opacity-60 transition-opacity duration-300 group-hover:opacity-100",
          curveStart ? "-start-6 -top-6" : "-end-6 -top-6",
        )}
        aria-hidden
      >
        <div
          className={cn(
            "size-full rounded-full blur-2xl",
            card.accent === "navy" ? "bg-teal-200/45" : "bg-[#14B8A6]/35",
          )}
        />
      </div>

      {/* Inner glass sheen */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-[#F0F7FF]/40"
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col p-6 pt-8 sm:p-7 sm:pt-9">
        <div className="mb-6 flex items-start justify-between gap-3">
          <GlowSquircle icon={card.icon} accent={card.accent} />
          <span
            className={cn(
              "mt-1 inline-flex size-2 rounded-full opacity-70",
              card.accent === "navy" ? "bg-[#0A192F]/30" : "bg-[#14B8A6]/80",
            )}
            aria-hidden
          />
        </div>

        <h3 className="text-balance text-xl font-extrabold leading-snug tracking-tight text-[#0A192F] sm:text-[1.35rem]">
          {card.title}
        </h3>
        <p className="mt-3 flex-1 text-pretty text-sm font-medium leading-relaxed text-slate-600/95 sm:text-[15px]">
          {card.desc}
        </p>

        <div
          className={cn(
            "mt-6 h-px w-full bg-gradient-to-r from-transparent to-transparent",
            card.accent === "navy" ? "via-[#0A192F]/12" : "via-[#14B8A6]/35",
          )}
          aria-hidden
        />
      </div>
    </motion.article>
  );
}

export function WhyChooseSection() {
  const { t } = useI18n();

  const cards: FeatureCard[] = [
    {
      id: "safe",
      icon: ShieldCheck,
      title: t.featureSafe,
      desc: t.featureSafeDesc,
      accent: "navy",
      curve: "start",
      bar: "from-[#0A192F]/25 via-[#14B8A6]/80 to-teal-300/60",
    },
    {
      id: "comfort",
      icon: Armchair,
      title: t.featureComfort,
      desc: t.featureComfortDesc,
      accent: "teal",
      curve: "end",
      bar: "from-teal-300/40 via-[#14B8A6] to-[#0A192F]/30",
    },
    {
      id: "time",
      icon: Clock3,
      title: t.featureTime,
      desc: t.featureTimeDesc,
      accent: "navy",
      curve: "end",
      bar: "from-teal-200/50 via-[#0A192F]/45 to-[#14B8A6]/50",
    },
    {
      id: "smart",
      icon: MapPinned,
      title: t.featureSmart,
      desc: t.featureSmartDesc,
      accent: "teal",
      curve: "start",
      bar: "from-[#0A192F]/25 via-[#14B8A6]/70 to-cyan-300/50",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-slate-50 py-16 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 10%, rgba(20,184,166,0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, rgba(10,25,47,0.06) 0%, transparent 55%)",
        }}
        aria-hidden
      />
      <TransitCurvesBackdrop />
      <div
        className="pointer-events-none absolute -start-20 top-10 size-80 rounded-full bg-teal-100/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -end-16 bottom-8 size-72 rounded-full bg-slate-200/50 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="mb-5 inline-flex items-center rounded-full border border-teal-200/80 bg-white/80 px-4 py-1.5 text-xs font-bold tracking-wide text-[#0A192F] shadow-sm backdrop-blur-md"
          >
            {t.whyBadge}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#0A192F] sm:text-4xl lg:text-[2.65rem]"
          >
            {t.whyTitle}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-4 max-w-2xl text-pretty text-sm font-medium leading-relaxed text-slate-600 sm:text-base"
          >
            {t.whyLead}
          </motion.p>
        </div>

        {/* Mobile: horizontal swipe · Tablet+: responsive grid */}
        <div
          className={cn(
            "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:snap-none sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 xl:grid-cols-4",
            "[&::-webkit-scrollbar]:hidden",
          )}
          style={{ perspective: "1200px" }}
        >
          {cards.map((card, index) => (
            <FeatureGlassCard key={card.id} card={card} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
