/** OpenStreetMap raster tiles — no API key; works on any public domain over HTTPS. */
export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const OSM_TILE_OPTIONS = {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
} as const;

/** Prefer stored Maps link; always fall back to exact lat/lng so navigation works offline of short links. */
export function stopNavigationUrl(stop: {
  lat: number;
  lng: number;
  googleMapsUrl?: string | null;
}): string {
  const url = stop.googleMapsUrl?.trim();
  if (url) return url;
  return `https://www.google.com/maps?q=${stop.lat},${stop.lng}`;
}

export function openStopInMaps(stop: {
  lat: number;
  lng: number;
  googleMapsUrl?: string | null;
}): void {
  window.open(stopNavigationUrl(stop), "_blank", "noopener,noreferrer");
}
