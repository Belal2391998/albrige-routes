import heroFleetGallery from "@/assets/hero-fleet-gallery.jpg";
import fleetBoardingGallery from "@/assets/fleet-boarding-gallery.jpg";
import fleetRoadGallery from "@/assets/fleet-road-gallery.jpg";
import fleetInteriorGallery from "@/assets/fleet-interior-gallery.jpg";
import type { LineCardMeta } from "@/data/transportData";
import type { ManagedRoute } from "@/lib/networkTypes";
import type { Locale } from "@/lib/i18n";

const BUS_IMAGES = [heroFleetGallery, fleetBoardingGallery, fleetRoadGallery, fleetInteriorGallery];

function ordinalBadge(routeNumber: string, locale: Locale, stops: number) {
  if (locale === "ar") return `الخط ${routeNumber} • ${stops} محطة تجمع`;
  if (locale === "de") return `Linie ${routeNumber} • ${stops} Haltestellen`;
  return `Line ${routeNumber} • ${stops} pickup stops`;
}

export function buildLineCardMeta(routes: ManagedRoute[]): LineCardMeta[] {
  return routes
    .filter((r) => r.isActive)
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((route, index) => {
      const stops = route.stations.slice().sort((a, b) => a.stationIndex - b.stationIndex);
      const snippetStops = stops.slice(0, 4);
      const pathAr = snippetStops.map((s) => s.name.ar).join(" ⟵ ");
      const pathEn = snippetStops.map((s) => s.name.en).join(" ← ");

      return {
        slug: route.slug,
        heading: route.name,
        badgeText: {
          ar: ordinalBadge(route.routeNumber, "ar", stops.length),
          en: ordinalBadge(route.routeNumber, "en", stops.length),
          de: ordinalBadge(route.routeNumber, "de", stops.length),
        },
        pathSnippet: {
          ar: pathAr || route.subtitle.ar,
          en: pathEn || route.subtitle.en,
        },
        accentGradient: "from-[#0A2240] to-[#0B2265]",
        badgeStyle: "bg-[#0A2240]/10 text-[#0A2240] dark:bg-white/10 dark:text-slate-100",
        iconBg: "bg-gradient-to-br from-[#0A2240] to-[#0B2265]",
        shadowTint: "rgba(10, 34, 64, 0.2)",
        busImage: BUS_IMAGES[index % BUS_IMAGES.length]!,
      };
    });
}
