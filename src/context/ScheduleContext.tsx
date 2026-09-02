import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Line, TrafficStatus } from "@/data/transportData";
import {
  batchSaveStations,
  createStation as apiCreateStation,
  createTransportLine,
  deleteTransportLine,
  getSessionStatus,
  logoutAdmin,
  mapRouteToCreateRequest,
  mapRouteToUpdateRequest,
  mapStationToBatchItem,
  mapStationToCreateRequest,
  mapStationToUpdateRequest,
  restoreDefaults as apiRestoreDefaults,
  toggleLineVisibility,
  updateSiteSettings,
  updateStation as apiUpdateStation,
  updateTransportLine,
} from "@/lib/api/adminApi";
import { ApiError } from "@/lib/api/client";
import { isApiConfigured } from "@/lib/api/config";
import {
  clearAdminSessionToken,
  getAdminSessionToken,
  setAdminSessionToken,
} from "@/lib/api/adminSession";
import { verifyAdminPasscode, DEFAULT_ADMIN_PASSWORD } from "@/lib/adminAuth";
import {
  createEmptyRoute,
  createEmptyStation,
  loadAdminNetwork,
  loadNetwork,
  persistNetwork,
  readLocalNetwork,
} from "@/lib/networkRepository";
import { subscribeToServerChanges } from "@/lib/api/networkStream";
import { broadcastNetworkChange, subscribeToNetworkChanges } from "@/lib/networkBroadcast";
import { managedRouteToLine, seedNetworkFromStaticLines, snapshotToLines } from "@/lib/networkSeed";
import type {
  AppSettings,
  ManagedRoute,
  ManagedStation,
  NetworkSnapshot,
  StationStatus,
} from "@/lib/networkTypes";
import { DEFAULT_APP_SETTINGS, newId, slugifyRoute } from "@/lib/networkTypes";
import type { Localized } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n";

const AUTH_KEY = "albridge_admin_auth";
/** @deprecated Use verifyAdminPasscode — kept for reference of the default seed password */
export const ADMIN_PIN = DEFAULT_ADMIN_PASSWORD;

export type StopScheduleOverride = {
  departureTime?: string;
  trafficStatus?: TrafficStatus;
  adminNote?: string;
  name?: Localized;
  description?: Localized;
  imageUrl?: string;
  googleMapsUrl?: string;
};

type ScheduleContextValue = {
  ready: boolean;
  apiConnected: boolean;
  snapshot: NetworkSnapshot;
  settings: AppSettings;
  /** All routes including inactive (admin) */
  allRoutes: ManagedRoute[];
  /** Active routes only (public) */
  activeRoutes: ManagedRoute[];
  liveLines: Line[];
  activeLiveLines: Line[];
  getLiveLine: (slug: string) => Line | undefined;
  getRouteById: (id: string) => ManagedRoute | undefined;
  updateStop: (stopId: string, patch: StopScheduleOverride) => void;
  updateStopTime: (stopId: string, departureTime: string) => void;
  updateStopStatus: (stopId: string, trafficStatus: TrafficStatus) => void;
  updateStopNote: (stopId: string, adminNote: string) => void;
  saveLineBulk: (stopPatches: Array<{ stopId: string } & StopScheduleOverride>) => Promise<void>;
  saveStation: (station: ManagedStation) => Promise<void>;
  addStation: (routeId: string, station?: Partial<ManagedStation>) => Promise<ManagedStation>;
  deleteStation: (stationId: string) => Promise<void>;
  createRoute: (partial?: Partial<ManagedRoute>) => Promise<ManagedRoute>;
  updateRoute: (routeId: string, patch: Partial<ManagedRoute>) => Promise<void>;
  setRouteActive: (routeId: string, isActive: boolean) => Promise<void>;
  deleteRoute: (routeId: string) => Promise<void>;
  resetStop: (stopId: string) => void;
  resetLine: (routeId: string) => void;
  resetToDefaults: () => Promise<void>;
  persistNow: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
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

function upsertStationInSnapshot(
  snapshot: NetworkSnapshot,
  station: ManagedStation,
): NetworkSnapshot {
  return {
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
}

function findStation(snapshot: NetworkSnapshot, stopId: string) {
  for (const route of snapshot.routes) {
    const station = route.stations.find((s) => s.id === stopId);
    if (station) return { route, station };
  }
  return null;
}

function applyStopPatch(station: ManagedStation, patch: StopScheduleOverride): ManagedStation {
  return {
    ...station,
    ...(patch.departureTime != null ? { defaultTime: patch.departureTime } : {}),
    ...(patch.trafficStatus != null ? { status: patch.trafficStatus as StationStatus } : {}),
    ...(patch.adminNote != null ? { notes: patch.adminNote } : {}),
    ...(patch.name != null ? { name: patch.name } : {}),
    ...(patch.description != null ? { description: patch.description } : {}),
    ...(patch.imageUrl != null ? { imageUrl: patch.imageUrl } : {}),
    ...(patch.googleMapsUrl != null ? { googleMapsUrl: patch.googleMapsUrl } : {}),
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

function hasApiAdminSession(): boolean {
  return isApiConfigured && Boolean(getAdminSessionToken());
}

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const [snapshot, setSnapshot] = useState<NetworkSnapshot>(() => seedNetworkFromStaticLines());
  const [ready, setReady] = useState(true);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  /** True while the SSE channel is connected, which makes the poll redundant. */
  const streamLive = useRef(false);

  const applySnapshot = useCallback((next: NetworkSnapshot) => {
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const reloadFromServer = useCallback(
    async (admin = false) => {
      const loaded =
        admin && hasApiAdminSession() ? await loadAdminNetwork(locale) : await loadNetwork(locale);
      applySnapshot(loaded);
      return loaded;
    },
    [applySnapshot, locale],
  );

  const commitLocal = useCallback(
    async (next: NetworkSnapshot) => {
      applySnapshot(next);
      if (!hasApiAdminSession()) {
        await persistNetwork(next);
      }
    },
    [applySnapshot],
  );

  const handleApiError = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 401 && isApiConfigured) {
      clearAdminSessionToken();
      try {
        window.sessionStorage.removeItem(AUTH_KEY);
      } catch {
        /* ignore */
      }
      setIsAdminUnlocked(false);
    }
    throw err;
  }, []);

  useEffect(() => {
    let cancelled = false;
    try {
      const local = readLocalNetwork();
      snapshotRef.current = local;
      setSnapshot(local);
      setReady(true);
      setIsAdminUnlocked(window.sessionStorage.getItem(AUTH_KEY) === "1");
    } catch {
      setIsAdminUnlocked(false);
    }

    void (async () => {
      try {
        const loaded = await loadNetwork(locale);
        if (cancelled) return;
        if (loaded.updatedAt !== snapshotRef.current.updatedAt) {
          applySnapshot(loaded);
        }
      } catch (err) {
        console.error("[ScheduleContext] network refresh failed", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applySnapshot, locale]);

  useEffect(() => {
    if (!isApiConfigured || window.sessionStorage.getItem(AUTH_KEY) !== "1") return;
    const token = getAdminSessionToken();
    if (!token) {
      setIsAdminUnlocked(false);
      try {
        window.sessionStorage.removeItem(AUTH_KEY);
      } catch {
        /* ignore */
      }
      return;
    }

    void getSessionStatus()
      .then(async (status) => {
        if (status.isAuthenticated) {
          setIsAdminUnlocked(true);
          await reloadFromServer(true);
          return;
        }
        clearAdminSessionToken();
        window.sessionStorage.removeItem(AUTH_KEY);
        setIsAdminUnlocked(false);
      })
      .catch(() => {
        clearAdminSessionToken();
        try {
          window.sessionStorage.removeItem(AUTH_KEY);
        } catch {
          /* ignore */
        }
        setIsAdminUnlocked(false);
      });
  }, [reloadFromServer]);

  useEffect(() => {
    const refreshNetwork = () => {
      if (document.visibilityState !== "visible") return;
      void reloadFromServer(isAdminUnlocked && hasApiAdminSession()).catch((err) =>
        console.error("[ScheduleContext] network refresh failed", err),
      );
    };
    document.addEventListener("visibilitychange", refreshNetwork);
    return () => document.removeEventListener("visibilitychange", refreshNetwork);
  }, [isAdminUnlocked, reloadFromServer]);

  // A save in the admin tab refreshes student pages left open in other tabs.
  useEffect(
    () =>
      subscribeToNetworkChanges(() => {
        void reloadFromServer(isAdminUnlocked && hasApiAdminSession()).catch((err) =>
          console.error("[ScheduleContext] broadcast refresh failed", err),
        );
      }),
    [isAdminUnlocked, reloadFromServer],
  );

  // Server push: an admin save on one device refreshes every connected device.
  useEffect(
    () =>
      subscribeToServerChanges({
        onChange: () => {
          void reloadFromServer(isAdminUnlocked && hasApiAdminSession()).catch((err) =>
            console.error("[ScheduleContext] stream refresh failed", err),
          );
        },
        onLiveChange: (live) => {
          streamLive.current = live;
        },
      }),
    [isAdminUnlocked, reloadFromServer],
  );

  // Fallback only: skipped while the push stream is connected.
  useEffect(() => {
    if (!isApiConfigured) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible" || streamLive.current) return;
      void reloadFromServer(isAdminUnlocked && hasApiAdminSession()).catch((err) =>
        console.error("[ScheduleContext] poll failed", err),
      );
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [isAdminUnlocked, reloadFromServer]);

  const allRoutes = useMemo(
    () => snapshot.routes.slice().sort((a, b) => a.displayOrder - b.displayOrder),
    [snapshot],
  );
  const settings = useMemo(
    () => ({ ...DEFAULT_APP_SETTINGS, ...snapshot.settings }),
    [snapshot.settings],
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
      applySnapshot(patchStationInSnapshot(snapshotRef.current, stopId, mapped));
    },
    [applySnapshot],
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
    async (stopPatches: Array<{ stopId: string } & StopScheduleOverride>) => {
      const previous = snapshotRef.current;

      let optimistic = previous;
      for (const p of stopPatches) {
        const found = findStation(optimistic, p.stopId);
        if (!found) continue;
        optimistic = patchStationInSnapshot(optimistic, p.stopId, applyStopPatch(found.station, p));
      }
      applySnapshot(optimistic);

      if (hasApiAdminSession()) {
        try {
          const first = findStation(previous, stopPatches[0]?.stopId ?? "");
          if (!first?.route.backendId) {
            throw new ApiError("Route is not linked to the server", 400);
          }

          const items = stopPatches.map((patch) => {
            const found = findStation(previous, patch.stopId);
            if (!found?.station.backendId) {
              throw new ApiError("Station is not linked to the server", 400);
            }
            const merged = applyStopPatch(found.station, patch);
            return mapStationToBatchItem(merged);
          });

          await batchSaveStations(first.route.backendId, items, locale);
          broadcastNetworkChange();
          await reloadFromServer(true);
          return;
        } catch (err) {
          applySnapshot(previous);
          handleApiError(err);
        }
      }

      await commitLocal(optimistic);
    },
    [applySnapshot, commitLocal, handleApiError, locale, reloadFromServer],
  );

  const saveStation = useCallback(
    async (station: ManagedStation) => {
      const previous = snapshotRef.current;
      // Paint the edit before the round-trip so the public view updates on click.
      const optimistic = upsertStationInSnapshot(previous, station);
      applySnapshot(optimistic);

      if (hasApiAdminSession()) {
        try {
          if (!station.backendId) {
            throw new ApiError("Station is not linked to the server", 400);
          }
          await apiUpdateStation(
            station.backendId,
            mapStationToUpdateRequest(station),
            locale,
          );
          broadcastNetworkChange();
          await reloadFromServer(true);
          return;
        } catch (err) {
          applySnapshot(previous);
          handleApiError(err);
        }
      }

      await commitLocal(optimistic);
    },
    [applySnapshot, commitLocal, handleApiError, locale, reloadFromServer],
  );

  const addStation = useCallback(
    async (routeId: string, partial?: Partial<ManagedStation>) => {
      const route = snapshotRef.current.routes.find((r) => r.id === routeId);
      if (!route) {
        throw new ApiError("Route not found", 404);
      }

      const index = (route.stations.length ?? 0) + 1;
      const station: ManagedStation = {
        ...createEmptyStation(routeId, index),
        ...partial,
        id: partial?.id ?? newId(),
        routeId,
        stationIndex: partial?.stationIndex ?? index,
      };

      const previous = snapshotRef.current;
      const optimistic = upsertStationInSnapshot(previous, station);
      applySnapshot(optimistic);

      if (hasApiAdminSession()) {
        try {
          if (!route.backendId) {
            throw new ApiError("Route is not linked to the server", 400);
          }

          await apiCreateStation(
            mapStationToCreateRequest(station, route.backendId),
            locale,
          );
          broadcastNetworkChange();
          await reloadFromServer(true);

          const refreshed = snapshotRef.current.routes.find((r) => r.id === routeId);
          return (
            refreshed?.stations.find((s) => s.stationIndex === index) ??
            refreshed?.stations.at(-1) ??
            station
          );
        } catch (err) {
          applySnapshot(previous);
          handleApiError(err);
          throw err;
        }
      }

      await commitLocal(optimistic);
      return station;
    },
    [applySnapshot, commitLocal, handleApiError, locale, reloadFromServer],
  );

  const deleteStation = useCallback(
    async (stationId: string) => {
      if (hasApiAdminSession()) {
        throw new ApiError("Deleting stations via API is not supported yet", 501);
      }
      const current = snapshotRef.current;
      const next: NetworkSnapshot = {
        ...current,
        updatedAt: new Date().toISOString(),
        routes: current.routes.map((route) => ({
          ...route,
          stations: route.stations
            .filter((s) => s.id !== stationId)
            .map((s, i) => ({ ...s, stationIndex: i + 1 })),
        })),
      };
      await commitLocal(next);
    },
    [commitLocal],
  );

  const createRoute = useCallback(
    async (partial?: Partial<ManagedRoute>) => {
      if (hasApiAdminSession()) {
        try {
          const route = createEmptyRoute({
            ...partial,
            displayOrder: partial?.displayOrder ?? snapshotRef.current.routes.length + 1,
            slug:
              partial?.slug ??
              slugifyRoute(
                partial?.routeNumber ?? String(Date.now() % 1000),
                partial?.name?.ar ?? "خط",
              ),
          });
          await createTransportLine(mapRouteToCreateRequest(route), locale);
          broadcastNetworkChange();
          await reloadFromServer(true);
          const created = snapshotRef.current.routes.find((r) => r.slug === route.slug);
          if (!created) throw new ApiError("Route was created but not returned", 500);
          return created;
        } catch (err) {
          handleApiError(err);
        }
      }

      const current = snapshotRef.current;
      const route = createEmptyRoute({
        ...partial,
        displayOrder: partial?.displayOrder ?? current.routes.length + 1,
      });
      const next: NetworkSnapshot = {
        ...current,
        updatedAt: new Date().toISOString(),
        routes: [...current.routes, route],
      };
      await commitLocal(next);
      return route;
    },
    [commitLocal, handleApiError, locale, reloadFromServer],
  );

  const updateRoute = useCallback(
    async (routeId: string, patch: Partial<ManagedRoute>) => {
      const current = snapshotRef.current;
      const existing = current.routes.find((r) => r.id === routeId);
      if (!existing) return;

      const merged = { ...existing, ...patch, id: existing.id };

      if (hasApiAdminSession()) {
        try {
          if (!existing.backendId) {
            throw new ApiError("Route is not linked to the server", 400);
          }
          await updateTransportLine(existing.backendId, mapRouteToUpdateRequest(merged), locale);
          broadcastNetworkChange();
          await reloadFromServer(true);
          return;
        } catch (err) {
          handleApiError(err);
        }
      }

      const next: NetworkSnapshot = {
        ...current,
        updatedAt: new Date().toISOString(),
        routes: current.routes.map((r) => (r.id === routeId ? merged : r)),
      };
      await commitLocal(next);
    },
    [commitLocal, handleApiError, locale, reloadFromServer],
  );

  const setRouteActive = useCallback(
    async (routeId: string, isActive: boolean) => {
      const existing = snapshotRef.current.routes.find((r) => r.id === routeId);
      if (!existing) return;

      if (hasApiAdminSession()) {
        try {
          if (!existing.backendId) {
            throw new ApiError("Route is not linked to the server", 400);
          }
          await toggleLineVisibility(existing.backendId, isActive, locale);
          broadcastNetworkChange();
          await reloadFromServer(true);
          return;
        } catch (err) {
          handleApiError(err);
        }
      }

      await updateRoute(routeId, { isActive });
    },
    [handleApiError, locale, reloadFromServer, updateRoute],
  );

  const deleteRoute = useCallback(
    async (routeId: string) => {
      const existing = snapshotRef.current.routes.find((r) => r.id === routeId);
      if (!existing) return;

      if (hasApiAdminSession()) {
        try {
          if (!existing.backendId) {
            throw new ApiError("Route is not linked to the server", 400);
          }
          await deleteTransportLine(existing.backendId, locale);
          broadcastNetworkChange();
          await reloadFromServer(true);
          return;
        } catch (err) {
          handleApiError(err);
        }
      }

      const current = snapshotRef.current;
      const next: NetworkSnapshot = {
        ...current,
        updatedAt: new Date().toISOString(),
        routes: current.routes.filter((r) => r.id !== routeId),
      };
      await commitLocal(next);
    },
    [commitLocal, handleApiError, locale, reloadFromServer],
  );

  const resetStop = useCallback((_stopId: string) => {
    /* legacy no-op */
  }, []);

  const resetLine = useCallback((_routeId: string) => {
    /* legacy no-op */
  }, []);

  const resetToDefaults = useCallback(async () => {
    if (hasApiAdminSession()) {
      try {
        await apiRestoreDefaults(locale);
        broadcastNetworkChange();
        await reloadFromServer(true);
        return;
      } catch (err) {
        handleApiError(err);
      }
    }

    const { seedNetworkFromStaticLines: seed } = await import("@/lib/networkSeed");
    const current = snapshotRef.current;
    await commitLocal({
      ...seed(),
      settings: { ...DEFAULT_APP_SETTINGS, ...current.settings },
    });
  }, [commitLocal, handleApiError, locale, reloadFromServer]);

  const persistNow = useCallback(async () => {
    if (hasApiAdminSession()) {
      await reloadFromServer(true);
      return;
    }
    await commitLocal(snapshotRef.current);
  }, [commitLocal, reloadFromServer]);

  const updateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const previous = snapshotRef.current;
      const optimistic: NetworkSnapshot = {
        ...previous,
        updatedAt: new Date().toISOString(),
        settings: { ...DEFAULT_APP_SETTINGS, ...previous.settings, ...patch },
      };
      applySnapshot(optimistic);

      if (hasApiAdminSession() && patch.showOfficeHours != null) {
        try {
          await updateSiteSettings({ showScheduleTimes: patch.showOfficeHours }, locale);
          broadcastNetworkChange();
          await reloadFromServer(true);
          return;
        } catch (err) {
          applySnapshot(previous);
          handleApiError(err);
        }
      }

      await commitLocal(optimistic);
    },
    [applySnapshot, commitLocal, handleApiError, locale, reloadFromServer],
  );

  const unlockAdmin = useCallback(
    async (pin: string) => {
      const result = await verifyAdminPasscode(pin);
      if (!result.ok) return false;

      if (result.sessionToken) {
        setAdminSessionToken(result.sessionToken);
      }

      try {
        window.sessionStorage.setItem(AUTH_KEY, "1");
      } catch {
        /* ignore */
      }

      setIsAdminUnlocked(true);

      if (isApiConfigured) {
        try {
          await reloadFromServer(true);
        } catch (err) {
          console.error("[ScheduleContext] admin snapshot load failed", err);
        }
      }

      return true;
    },
    [reloadFromServer],
  );

  const lockAdmin = useCallback(() => {
    if (isApiConfigured && getAdminSessionToken()) {
      void logoutAdmin().catch(() => {
        /* ignore */
      });
    }
    clearAdminSessionToken();
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
      apiConnected: isApiConfigured,
      snapshot,
      settings,
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
      updateSettings,
      isAdminUnlocked,
      unlockAdmin,
      lockAdmin,
    }),
    [
      ready,
      snapshot,
      settings,
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
      updateSettings,
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
