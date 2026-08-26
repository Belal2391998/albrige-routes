import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bus, Clock3, MapPinned, Route as RouteIcon, Sparkles } from "lucide-react";
import { FleetServicesCarousel } from "@/components/FleetServicesCarousel";
import { Header } from "@/components/Header";
import { RoutesImmersiveSection } from "@/components/RoutesImmersiveSection";
import { WhyChooseSection } from "@/components/WhyChooseSection";
import heroBusFull from "@/assets/hero-bus-full.jpg";
import heroFleetVideo from "@/assets/hero-fleet.mp4";
import heroSmartCampus from "@/assets/hero-smart-campus-twilight.png";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Index,
});

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

function Index() {
  const { t } = useI18n();
  const [ctaHovered, setCtaHovered] = useState(false);
  const isDark = useIsDarkMode();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    document.title = t.homeMetaTitle;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t.homeMetaDesc);
  }, [t]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isDark) {
      video.pause();
      return;
    }
    const play = video.play();
    if (play && typeof play.catch === "function") play.catch(() => undefined);
  }, [isDark]);

  const stats = [
    { label: t.heroStatSchedule, icon: Clock3 },
    { label: t.heroStatLines, icon: RouteIcon },
    { label: t.heroStatStops, icon: MapPinned },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0A192F]">
      <Header />

      {/* 1) Hero — light: bus video · dark: smart campus */}
      <section className="relative isolate min-h-[100svh] w-full overflow-hidden">
        {/* Light mode: fleet video — full-bleed */}
        <motion.div
          animate={{ scale: [1.02, 1.06, 1.02] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[#081226] will-change-transform dark:hidden"
        >
          <video
            ref={videoRef}
            className="absolute inset-0 size-full object-cover object-center"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={heroBusFull}
            aria-hidden
          >
            <source src={heroFleetVideo} type="video/mp4" />
          </video>
        </motion.div>

        {/* Dark mode: twilight smart campus — full-bleed */}
        <motion.div
          animate={{ scale: [1.02, 1.06, 1.02] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 hidden will-change-transform dark:block"
        >
          <img
            src={heroSmartCampus}
            alt=""
            className="absolute inset-0 size-full min-h-full min-w-full object-cover object-center"
            aria-hidden
          />
        </motion.div>

        {/* Depth overlays — navy + turquoise */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/80 via-[#0A192F]/45 to-[#0A192F]/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A192F]/75 via-transparent to-[#0A192F]/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_35%,rgba(20,184,166,0.18),transparent_55%)]" />

        <span
          className="pointer-events-none absolute -start-16 bottom-24 size-64 rounded-full bg-[#14B8A6]/12 blur-3xl"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute end-10 top-28 size-52 rounded-full bg-cyan-400/10 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-4 py-24 sm:px-6 sm:py-28">
          <div className="max-w-3xl">
            <motion.div
              initial={{ y: -22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-[#14B8A6]/35 bg-[#0A192F]/70 px-4 py-2 text-sm font-semibold text-teal-200 shadow-[0_0_24px_rgba(20,184,166,0.12)] backdrop-blur-md"
            >
              <Sparkles className="size-4 text-[#14B8A6]" />
              <span>{t.heroBadge}</span>
            </motion.div>

            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              <motion.span
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="block drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]"
              >
                {t.heroTitleBefore}
              </motion.span>
              <motion.span
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="mt-2 block text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]"
              >
                {t.heroTitleGold}{" "}
                <span className="bg-gradient-to-l from-teal-200 via-[#14B8A6] to-cyan-300 bg-clip-text text-transparent [text-shadow:none]">
                  {t.heroTitleAccent}
                </span>
              </motion.span>
            </h1>

            <motion.p
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-slate-200/90 sm:text-lg"
            >
              {t.heroLead}
            </motion.p>

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.45, type: "spring", stiffness: 160, damping: 18 }}
              className="mt-8 space-y-5"
            >
              <motion.a
                href="#lines"
                onHoverStart={() => setCtaHovered(true)}
                onHoverEnd={() => setCtaHovered(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 rounded-xl bg-[#14B8A6] px-8 py-4 text-sm font-extrabold text-[#0A192F] shadow-[0_12px_32px_-12px_rgba(20,184,166,0.55)] transition hover:bg-teal-400"
              >
                <motion.span
                  animate={{ x: ctaHovered ? -6 : 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="inline-flex"
                >
                  <Bus className="size-5" />
                </motion.span>
                <span>{t.homeCta}</span>
              </motion.a>

              <div className="flex flex-wrap gap-3 pt-1">
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 + i * 0.08, duration: 0.4 }}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0A192F]/60 px-3.5 py-2.5 text-sm font-semibold text-slate-100 backdrop-blur-md"
                    >
                      <Icon className="size-4 shrink-0 text-[#14B8A6]" />
                      <span>{stat.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* فاصل بين فيديو/صورة الهيرو وخلفية قسم الخطوط */}
      <div
        className="relative h-12 sm:h-16 lg:h-20"
        style={{ backgroundColor: "#0A192F" }}
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(20,184,166,0.18),transparent_65%)]" />
        <div className="absolute inset-x-[12%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#14B8A6]/55 to-transparent" />
        <span className="absolute start-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#14B8A6] shadow-[0_0_16px_rgba(20,184,166,0.7)]" />
      </div>

      {/* 2) Lines — immersive multi-layer composition */}
      <RoutesImmersiveSection />

      {/* 3) Why choose Al-Breeji */}
      <WhyChooseSection />

      {/* 4) Fleet services carousel */}
      <FleetServicesCarousel />
    </div>
  );
}
