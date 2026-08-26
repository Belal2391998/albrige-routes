import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { OSM_TILE_OPTIONS, OSM_TILE_URL } from "@/lib/mapHelpers";

/**
 * Client-only Leaflet map pinned to a stop.
 * Tap/click opens Google Maps (app on phone, browser on desktop).
 */
export default function MiniMap({
  lat,
  lng,
  color,
  mapsUrl,
}: {
  lat: number;
  lng: number;
  color: string;
  /** Google Maps / short link for this stop — opens on tap */
  mapsUrl: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapsUrlRef = useRef(mapsUrl);
  mapsUrlRef.current = mapsUrl;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const openInGoogleMaps = () => {
      const url = mapsUrlRef.current;
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
    };

    const map = L.map(el, {
      attributionControl: true,
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true,
    }).setView([lat, lng], 16);

    L.tileLayer(OSM_TILE_URL, { ...OSM_TILE_OPTIONS }).addTo(map);

    const marker = L.circleMarker([lat, lng], {
      radius: 12,
      color,
      fillColor: color,
      fillOpacity: 0.85,
      weight: 3,
    }).addTo(map);

    map.on("click", openInGoogleMaps);
    marker.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      openInGoogleMaps();
    });

    const fixSize = () => {
      map.invalidateSize({ animate: false });
      map.setView([lat, lng], map.getZoom(), { animate: false });
    };

    const raf = requestAnimationFrame(fixSize);
    const t1 = window.setTimeout(fixSize, 120);
    const t2 = window.setTimeout(fixSize, 450);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            fixSize();
          })
        : null;
    ro?.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro?.disconnect();
      map.off("click", openInGoogleMaps);
      map.remove();
    };
  }, [lat, lng, color]);

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-2xl">
      <div
        ref={ref}
        className="h-full w-full cursor-pointer [&_.leaflet-control-attribution]:text-[9px]"
        role="link"
        tabIndex={0}
        aria-label="فتح الموقع في خرائط Google"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            window.open(mapsUrl, "_blank", "noopener,noreferrer");
          }
        }}
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-8 text-center text-[11px] font-bold text-white">
        اضغط لفتح Google Maps على هاتفك
      </span>
    </div>
  );
}
