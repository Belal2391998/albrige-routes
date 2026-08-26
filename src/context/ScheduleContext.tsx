import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Line, TrafficStatus } from "@/data/transportData";
import {
  createEmptyRoute,
  createEmptyStation,
  loadNetwork,
  persistNetwork,
} from "@/lib/networkRepository";
import { managedRouteToLine, seedNetworkFromStaticLines, snapshotToLines } from "@/lib/networkSeed";
import type {
  ManagedRoute,
  ManagedStation,
  NetworkSnapshot,
  StationStatus,
} from "@/lib/networkTypes";
import { newId } from "@/lib/networkTypes";
import { isSupabaseConfigured } from "@/lib/supabase";
import { verifyAdminPassword, DEFAULT_ADMIN_PASSWORD } from "@/lib/adminAuth";

const AUTH_KEY = "albridge_admin_auth";
/** @deprecated Use verifyAdminPassword — kept for reference of the default seed password */
export const ADMIN_PIN = DEFAULT_ADMIN_PASSWORD;

export type StopScheduleOverride = {
  departureTime?: string;
  trafficStatus?: TrafficStatus;
  adminNote?: string;
};

type ScheduleContextValue = {
  ready: boolean;
  storageMode: "supabase" | "local";
  supabaseEnabled: boolean;
  snapshot: NetworkSnapshot;
  /** All routes including inactive (admin) */
  allRoutes: ManagedRoute[];
  /** Active routes only (public) */
  activeRoutes: ManagedRoute[];
  liveLines: Line[];
  activeLiveLines: Line[];
  getLiveLine: (slug: string) => Line | undefined;
  getRouteById: (id: string) => ManagedRoute | undefined;
  // Station schedule updates
  updateStop: (stopId: string, patch: StopScheduleOverride) => void;
  updateStopTime: (stopId: string, departureTime: string) => void;
  updateStopStatus: (stopId: string, trafficStatus: TrafficStatus) => void;
  updateStopNote: (stopId: string, adminNote: string) => void;
  saveLineBulk: (stopPatches: Array<{ stopId: string } & StopScheduleOverride>) => void;
  saveStation: (station: ManagedStation) => Promise<void>;
  addStation: (routeId: string, station?: Partial<ManagedStation>) => Promise<ManagedStation>;
  deleteStation: (stationId: string) => Promise<void>;
  // Route management
  createRoute: (partial?: Partial<ManagedRoute>) => Promise<ManagedRoute>;
  updateRoute: (routeId: string, patch: Partial<ManagedRoute>) => Promise<void>;
  setRouteActive: (routeId: string, isActive: boolean) => Promise<void>;
  deleteRoute: (routeId: string) => Promise<void>;
  resetStop: (stopId: string) => void;
  resetLine: (routeId: string) => void;
  resetToDefaults: () => Promise<void>;
  persistNow: () => Promise<void>;
  isAdminUnlocked: boolean;
  unlockAdmin: (pin: string) => Promise<boolean>;
  lockAdmin: () => void;
};

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

function patchStationInSnapshot(
  snapshot: NetworkSnapshot,
  stopId: string,
  patch: Partial<ManagedStation>,
): NetworkSnapshot {
  return {
    ...snapshot,
    updatedAt: new Date().toISOString(),
    routes: snapshot.routes.map((route) => ({
      ...route,
      stations: route.stations.map((s) => (s.id === stopId ? { ...s, ...patch } : s)),
    })),
  };
}

export function shiftDepartureTime(time: string, deltaMinutes: number): string {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return time;
  let hours = Number(m[1]);
  const minutes = Number(m[2]);
  const ap = m[3]!.toUpperCase() as "AM" | "PM";
  if (ap === "PM" && hours < 12) hours += 12;
  if (ap === "AM" && hours === 12) hours = 0;
  let total = hours * 60 + minutes + deltaMinutes;
  total = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(total / 60);
  const min = total % 60;
  const nextAp = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, "0")}:${String(min).padStart(2, "0")} ${nextAp}`;
}

export function ScheduleProvider({ children }: { children: ReactNode }) {
  // Stable seed on server + client first paint (avoids hydration mismatch).
  const [snapshot, setSnapshot] = useState<NetworkSnapshot>(() => seedNetworkFromStaticLines());
  const [ready, setReady] = useState(false);
  const [storageMode, setStorageMode] = useState<"supabase" | "local">("local");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { snapshot: loaded, source } = await loadNetwork();
        if (!cancelled) {
          setSnapshot(loaded);
          setStorageMode(source);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
      try {
        setIsAdminUnlocked(window.sessionStorage.getItem(AUTH_KEY) === "1");
      } catch {
        setIsAdminUnlocked(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback(async (next: NetworkSnapshot) => {
    setSnapshot(next);
    const mode = await persistNetwork(next);
    setStorageMode(mode);
  }, []);

  const allRoutes = useMemo(
    () => snapshot.routes.slice().sort((a, b) => a.displayOrder - b.displayOrder),
    [snapshot],
  );
  const activeRoutes = useMemo(() => allRoutes.filter((r) => r.isActive), [allRoutes]);
  const liveLines = useMemo(() => snapshotToLines(snapshot, false), [snapshot]);
  const activeLiveLines = useMemo(() => snapshotToLines(snapshot, true), [snapshot]);

  const getLiveLine = useCallback(
    (slug: string) => {
      const route = snapshot.routes.find((r) => r.slug === slug && r.isActive);
      return route ? managedRouteToLine(route) : undefined;
    },
    [snapshot],
  );

  const getRouteById = useCallback(
    (id: string) => snapshot.routes.find((r) => r.id === id),
    [snapshot],
  );

  const updateStop = useCallback(
    (stopId: string, patch: StopScheduleOverride) => {
      const mapped: Partial<ManagedStation> = {};
      if (patch.departureTime != null) mapped.defaultTime = patch.departureTime;
      if (patch.trafficStatus != null) mapped.status = patch.trafficStatus as StationStatus;
      if (patch.adminNote != null) mapped.notes = patch.adminNote;
      void commit(patchStationInSnapshot(snapshot, stopId, mapped));
    },
    [commit, snapshot],
  );

  const updateStopTime = useCallback(
    (stopId: string, departureTime: string) => updateStop(stopId, { departureTime }),
    [updateStop],
  );
  const updateStopStatus = useCallback(
    (stopId: string, trafficStatus: TrafficStatus) => updateStop(stopId, { trafficStatus }),
    [updateStop],
  );
  const updateStopNote = useCallback(
    (stopId: string, adminNote: string) => updateStop(stopId, { adminNote }),
    [updateStop],
  );

  const saveLineBulk = useCallback(
    (stopPatches: Array<{ stopId: string } & StopScheduleOverride>) => {
      let next = snapshot;
      for (const p of stopPatches) {
        const mapped: Partial<ManagedStation> = {};
        if (p.departureTime != null) mapped.defaultTime = p.departureTime;
        if (p.trafficStatus != null) mapped.status = p.trafficStatus as StationStatus;
        if (p.adminNote != null) mapped.notes = p.adminNote;
        next = patchStationInSnapshot(next, p.stopId, mapped);
      }
      void commit(next);
    },
    [commit, snapshot],
  );

  const saveStation = useCallback(
    async (station: ManagedStation) => {
      const next: NetworkSnapshot = {
        ...snapshot,
        updatedAt: new Date().toISOString(),
        routes: snapshot.routes.map((route) =>
          route.id !== station.routeId
            ? route
            : {
                ...route,
                stations: route.stations.some((s) => s.id === station.id)
                  ? route.stations.map((s) => (s.id === station.id ? station : s))
                  : [...route.stations, station].sort((a, b) => a.stationIndex - b.stationIndex),
              },
        ),
      };
      await commit(next);
    },
    [commit, snapshot],
  );

  const addStation = useCallback(
    async (routeId: string, partial?: Partial<ManagedStation>) => {
      const route = snapshot.routes.find((r) => r.id === routeId);
      const index = (route?.stations.length ?? 0) + 1;
      const station = {
        ...createEmptyStation(routeId, index),
        ...partial,
        id: partial?.id ?? newId(),
        routeId,
        stationIndex: partial?.stationIndex ?? index,
      };
      await saveStation(station);
      return station;
    },
    [saveStation, snapshot.routes],
  );

  const deleteStation = useCallback(
    async (stationId: string) => {
      const next: NetworkSnapshot = {
        ...snapshot,
        updatedAt: new Date().toISOString(),
        routes: snapshot.routes.map((route) => ({
          ...route,
          stations: route.stations
            .filter((s) => s.id !== stationId)
            .map((s, i) => ({ ...s, stationIndex: i + 1 })),
        })),
      };
      await commit(next);
    },
    [commit, snapshot],
  );

  const createRoute = useCallback(
    async (partial?: Partial<ManagedRoute>) => {
      const route = createEmptyRoute({
        ...partial,
        displayOrder: partial?.displayOrder ?? snapshot.routes.length + 1,
      });
      const next: NetworkSnapshot = {
        ...snapshot,
        updatedAt: new Date().toISOString(),
        routes: [...snapshot.routes, route],
      };
      await commit(next);
      return route;
    },
    [commit, snapshot],
  );

  const updateRoute = useCallback(
    async (routeId: string, patch: Partial<ManagedRoute>) => {
      const next: NetworkSnapshot = {
        ...snapshot,
        updatedAt: new Date().toISOString(),
        routes: snapshot.routes.map((r) => (r.id === routeId ? { ...r, ...patch, id: r.id } : r)),
      };
      await commit(next);
    },
    [commit, snapshot],
  );

  const setRouteActive = useCallback(
    async (routeId: string, isActive: boolean) => updateRoute(routeId, { isActive }),
    [updateRoute],
  );

  const deleteRoute = useCallback(
    async (routeId: string) => {
      const next: NetworkSnapshot = {
        ...snapshot,
        updatedAt: new Date().toISOString(),
        routes: snapshot.routes.filter((r) => r.id !== routeId),
      };
      await commit(next);
    },
    [commit, snapshot],
  );

  const resetStop = useCallback((_stopId: string) => {
    /* legacy no-op — station fields are source of truth now */
  }, []);

  const resetLine = useCallback((_routeId: string) => {
    /* legacy no-op */
  }, []);

  const resetToDefaults = useCallback(async () => {
    const { seedNetworkFromStaticLines } = await import("@/lib/networkSeed");
    await commit(seedNetworkFromStaticLines());
  }, [commit]);

  const persistNow = useCallback(async () => {
    await commit(snapshot);
  }, [commit, snapshot]);

  const unlockAdmin = useCallback(async (pin: string) => {
    const ok = await verifyAdminPassword(pin);
    if (!ok) return false;
    try {
      window.sessionStorage.setItem(AUTH_KEY, "1");
    } catch {
      /* ignore */
    }
    setIsAdminUnlocked(true);
    return true;
  }, []);

  const lockAdmin = useCallback(() => {
    try {
      window.sessionStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
    setIsAdminUnlocked(false);
  }, []);

  const value = useMemo<ScheduleContextValue>(
    () => ({
      ready,
      storageMode,
      supabaseEnabled: isSupabaseConfigured,
      snapshot,
      allRoutes,
      activeRoutes,
      liveLines,
      activeLiveLines,
      getLiveLine,
      getRouteById,
      updateStop,
      updateStopTime,
      updateStopStatus,
      updateStopNote,
      saveLineBulk,
      saveStation,
      addStation,
      deleteStation,
      createRoute,
      updateRoute,
      setRouteActive,
      deleteRoute,
      resetStop,
      resetLine,
      resetToDefaults,
      persistNow,
      isAdminUnlocked,
      unlockAdmin,
      lockAdmin,
    }),
    [
      ready,
      storageMode,
      snapshot,
      allRoutes,
      activeRoutes,
      liveLines,
      activeLiveLines,
      getLiveLine,
      getRouteById,
      updateStop,
      updateStopTime,
      updateStopStatus,
      updateStopNote,
      saveLineBulk,
      saveStation,
      addStation,
      deleteStation,
      createRoute,
      updateRoute,
      setRouteActive,
      deleteRoute,
      resetStop,
      resetLine,
      resetToDefaults,
      persistNow,
      isAdminUnlocked,
      unlockAdmin,
      lockAdmin,
    ],
  );

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used within ScheduleProvider");
  return ctx;
}
