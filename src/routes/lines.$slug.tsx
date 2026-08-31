import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Header } from "@/components/Header";
import { LineHeroBanner } from "@/components/LineHeroBanner";
import { SafeRouteStepper } from "@/components/RouteStepper";
import { StopModal } from "@/components/StopModal";
import { getLineBySlug, type Stop } from "@/data/transportData";
import { useSchedule } from "@/context/ScheduleContext";
import { pick, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/lines/$slug")({
  // Client-only UI avoids SPA navigation hydration crashes on the heavy route map.
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search["stop"];
    const n =
      typeof raw === "number" ? raw : typeof raw === "string" && raw !== "" ? Number(raw) : NaN;
    if (Number.isFinite(n) && n > 0) return { stop: n };
    return {};
  },
  loader: ({ params }) => {
    return { slug: params.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "الخط غير متوفر | البريجي" }, { name: "robots", content: "noindex" }],
      };
    }
    const line = getLineBySlug(loaderData.slug);
    const title = line ? `${line.title.ar} | شبكة البريجي للنقل` : "البريجي";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: line ? `${line.subtitle.ar} — نقاط التجمع والمواقع على خرائط Google.` : "",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: line?.subtitle.ar ?? "" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: LinePage,
});

function LinePage() {
  const { slug } = Route.useLoaderData();
  return <LineView key={slug} slug={slug} />;
}

function LineView({ slug }: { slug: string }) {
  const { stop: stopParam } = Route.useSearch();
  const { locale, t } = useI18n();
  const { getLiveLine } = useSchedule();
  const line = getLiveLine(slug) ?? getLineBySlug(slug);
  const stopsLength = line?.stops.length ?? 0;
  const [activeIndex, setActiveIndex] = useState(() => {
    if (!line) return 0;
    return stopParam && stopParam > 0 && stopParam <= line.stops.length ? stopParam - 1 : 0;
  });
  const [modalStop, setModalStop] = useState<Stop | null>(null);

  useEffect(() => {
    if (!line) return;
    document.title = `${pick(line.title, locale)} | ${t.lineMetaSuffix}`;
  }, [slug, locale, t.lineMetaSuffix, line]);

  useEffect(() => {
    if (stopsLength === 0) return;
    const max = Math.max(0, stopsLength - 1);
    setActiveIndex((i) => Math.min(Math.max(0, i), max));
  }, [slug, stopsLength]);

  if (!line) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <p className="text-sm text-muted-foreground">الخط غير متوفر.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <LineHeroBanner line={line} />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="relative w-full overflow-x-hidden overflow-y-visible bg-slate-50/50 px-1 pb-4 pt-3 transition-colors dark:bg-slate-950/90 sm:px-0 sm:pt-4 md:pb-36"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)] dark:opacity-55"
          style={{
            backgroundImage: "radial-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 hidden opacity-40 dark:block"
          style={{
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />
        <div className="relative z-10 w-full">
          <SafeRouteStepper
            line={line}
            activeIndex={activeIndex}
            onActiveChange={setActiveIndex}
            onOpenStop={setModalStop}
          />
        </div>
      </motion.main>

      <StopModal stop={modalStop} color={line.color} onClose={() => setModalStop(null)} />
    </div>
  );
}
