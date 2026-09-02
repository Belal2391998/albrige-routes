import { API_BASE_URL, isApiConfigured } from "@/lib/api/config";
import type { ApiNetworkSnapshot, ApiStation, ApiTransportLine } from "@/lib/api/types";
import type { TrafficStatus } from "@/data/transportData";
import type { Locale } from "@/lib/i18n";
import type {
  AppSettings,
  LecturePickupSlot,
  ManagedRoute,
  ManagedStation,
  NetworkSnapshot,
} from "@/lib/networkTypes";
import { DEFAULT_APP_SETTINGS } from "@/lib/networkTypes";
import { routeStableId, stationStableId } from "@/lib/stableUuid";
import { apiGet } from "@/lib/api/client";

function resolveImageUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  if (isApiConfigured && path.startsWith("/")) return `${API_BASE_URL}${path}`;
  return path;
}

function toLocalized(text: { ar: string; en: string; de?: string }) {
  return {
    ar: text.ar,
    en: text.en,
    ...(text.de ? { de: text.de } : {}),
  };
}

function trafficFromCode(code: string): TrafficStatus {
  const c = code.trim().toLowerCase();
  if (c === "moderate" || c === "بطيء") return "moderate";
  if (c === "congested" || c === "مزدحم") return "congested";
  return "clear";
}

function mapStation(station: ApiStation, routeId: string, slug: string): ManagedStation {
  const lectureSlots: LecturePickupSlot[] = (station.lectureSchedules ?? [])
    .slice()
    .sort((a, b) => a.lectureTime.localeCompare(b.lectureTime))
    .map((s) => ({
      lectureLabel: s.lectureTime,
      pickupTime: s.gatheringTime,
    }));

  return {
    id: stationStableId(slug, station.stationNumber),
    backendId: station.id,
    routeId,
    stationIndex: station.stationNumber,
    name: toLocalized(station.name),
    description: toLocalized(station.descriptionOrLandmark),
    defaultTime: station.defaultGatheringTime || lectureSlots[0]?.pickupTime || "",
    status: trafficFromCode(station.trafficStatusCode || station.trafficStatus),
    notes: station.adminNotes ?? "",
    lat: station.latitude,
    lng: station.longitude,
    googleMapsUrl:
      station.googleMapsUrl?.trim() ||
      `https://www.google.com/maps?q=${station.latitude},${station.longitude}`,
    imageUrl: resolveImageUrl(station.imagePath || ""),
    lectureSlots: lectureSlots.length > 0 ? lectureSlots : undefined,
  };
}

function mapLine(line: ApiTransportLine, stations: ManagedStation[]): ManagedRoute {
  return {
    id: routeStableId(line.slug),
    backendId: line.id,
    routeNumber: String(line.lineNumber),
    slug: line.slug,
    name: toLocalized(line.name),
    subtitle: toLocalized(line.descriptionOrRouteRange),
    badge: toLocalized(line.badge),
    isActive: line.isVisibleInPublicMenu,
    displayOrder: line.lineNumber,
    createdAt: line.updatedAt,
    stations: stations.slice().sort((a, b) => a.stationIndex - b.stationIndex),
    returnDepartures: line.returnDepartureTimes?.length ? line.returnDepartureTimes : undefined,
    estimatedDurationMinutes: line.estimatedDurationMinutes,
  };
}

/** Converts ASP.NET public network snapshot → frontend NetworkSnapshot. */
export function mapApiSnapshotToNetwork(api: ApiNetworkSnapshot): NetworkSnapshot {
  const stationsByLine = new Map<number, ApiStation[]>();
  for (const station of api.stations ?? []) {
    const list = stationsByLine.get(station.transportLineId) ?? [];
    list.push(station);
    stationsByLine.set(station.transportLineId, list);
  }

  const routes: ManagedRoute[] = (api.lines ?? []).map((line) => {
    const routeId = routeStableId(line.slug);
    const lineStations = (stationsByLine.get(line.id) ?? [])
      .slice()
      .sort((a, b) => a.stationNumber - b.stationNumber)
      .map((s) => mapStation(s, routeId, line.slug));
    return mapLine(line, lineStations);
  });

  return {
    version: 1,
    routes,
    settings: {
      showOfficeHours:
        typeof api.settings?.showScheduleTimes === "boolean"
          ? api.settings.showScheduleTimes
          : DEFAULT_APP_SETTINGS.showOfficeHours,
    },
    updatedAt:
      typeof api.updatedAt === "string"
        ? new Date(api.updatedAt).toISOString()
        : new Date().toISOString(),
  };
}

export async function fetchPublicNetworkSnapshot(locale?: Locale): Promise<NetworkSnapshot> {
  const data = await apiGet<ApiNetworkSnapshot>("/api/network/snapshot", { locale });
  return mapApiSnapshotToNetwork(data);
}

export async function fetchAdminNetworkSnapshot(locale?: Locale): Promise<NetworkSnapshot> {
  const data = await apiGet<ApiNetworkSnapshot>("/api/network/snapshot/admin", {
    locale,
    admin: true,
  });
  return mapApiSnapshotToNetwork(data);
}
