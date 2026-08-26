import { lines, type Line } from "@/data/transportData";
import type { Localized } from "@/lib/i18n";
import type { ManagedRoute, ManagedStation, NetworkSnapshot } from "@/lib/networkTypes";

function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function toLocalized(source: Localized): Localized {
  return {
    ar: source.ar,
    en: source.en,
    ...(source.de ? { de: source.de } : {}),
  };
}

export function seedNetworkFromStaticLines(): NetworkSnapshot {
  const routes: ManagedRoute[] = lines.map((line, index) => {
    const routeId = `route-${line.slug}`;
    const stations: ManagedStation[] = line.stops.map((stop) => ({
      id: `station-${line.slug}-${stop.order}`,
      routeId,
      stationIndex: stop.order,
      name: toLocalized(stop.name),
      description: toLocalized(stop.landmarkDescription),
      defaultTime: stop.departureTime,
      status: stop.trafficStatus ?? "clear",
      notes: stop.adminNote ?? "",
      lat: stop.lat,
      lng: stop.lng,
      googleMapsUrl: stop.googleMapsUrl || mapsUrl(stop.lat, stop.lng),
      imageUrl: stop.imageUrl,
    }));

    return {
      id: routeId,
      routeNumber: String(line.id),
      slug: line.slug,
      name: toLocalized(line.title),
      subtitle: toLocalized(line.subtitle),
      badge: toLocalized(line.badge),
      isActive: true,
      displayOrder: index + 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      stations,
    };
  });

  return {
    version: 1,
    routes,
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

/** Adapt managed network → legacy Line shape used across the UI */
export function managedRouteToLine(route: ManagedRoute): Line {
  const numericId = Number.parseInt(route.routeNumber, 10);
  return {
    id: Number.isFinite(numericId) ? numericId : route.displayOrder,
    slug: route.slug,
    title: route.name,
    subtitle: route.subtitle,
    badge: route.badge,
    color: "#0B2265",
    stops: route.stations
      .slice()
      .sort((a, b) => a.stationIndex - b.stationIndex)
      .map((s) => ({
        id: s.id,
        name: s.name,
        lineId: Number.isFinite(numericId) ? numericId : route.displayOrder,
        order: s.stationIndex,
        lat: s.lat,
        lng: s.lng,
        imageUrl: s.imageUrl,
        landmarkDescription: s.description,
        googleMapsUrl: s.googleMapsUrl || mapsUrl(s.lat, s.lng),
        departureTime: s.defaultTime,
        trafficStatus: s.status,
        adminNote: s.notes,
      })),
  };
}

export function snapshotToLines(snapshot: NetworkSnapshot, activeOnly = false): Line[] {
  return snapshot.routes
    .filter((r) => (activeOnly ? r.isActive : true))
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(managedRouteToLine);
}
