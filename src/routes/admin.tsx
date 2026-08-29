import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowRight,
  Bus,
  Check,
  Clock3,
  KeyRound,
  Lock,
  Plus,
  RefreshCcw,
  Route as RouteIcon,
  Save,
  Settings,
  Shield,
  Trash2,
  Unlock,
} from "lucide-react";
import { Header } from "@/components/Header";
import { AdminSecurityPanel } from "@/components/AdminSecurityPanel";
import type { TrafficStatus } from "@/data/transportData";
import { shiftDepartureTime, useSchedule } from "@/context/ScheduleContext";
import type { ManagedRoute, ManagedStation } from "@/lib/networkTypes";
import { pick, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "لوحة التحكم | البريجي" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

const NAVY = "#0A192F";
const TEAL = "#14B8A6";

const STATUS_OPTIONS: Array<{ id: TrafficStatus; tone: string }> = [
  { id: "clear", tone: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" },
  { id: "moderate", tone: "border-amber-400/40 bg-amber-500/15 text-amber-200" },
  { id: "congested", tone: "border-rose-400/40 bg-rose-500/15 text-rose-200" },
];

function statusLabel(
  id: TrafficStatus,
  t: { trafficClear: string; trafficModerate: string; trafficCongested: string },
) {
  if (id === "moderate") return t.trafficModerate;
  if (id === "congested") return t.trafficCongested;
  return t.trafficClear;
}

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden text-slate-100"
      style={{ backgroundColor: NAVY }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(20,184,166,0.16),transparent_45%),radial-gradient(ellipse_at_90%_10%,rgba(56,189,248,0.08),transparent_40%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <Header />
      <div className="relative">{children}</div>
    </div>
  );
}

function fieldClass(error?: boolean) {
  return cn(
    "w-full rounded-xl border bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition",
    "placeholder:text-slate-500 focus:border-[#14B8A6]/50 focus:ring-2 focus:ring-[#14B8A6]/20",
    error ? "border-rose-400/60 focus:ring-rose-400/25" : "border-white/10",
  );
}

function AdminPage() {
  const { locale, dir, t } = useI18n();
  const navigate = useNavigate();
  const {
    ready,
    storageMode,
    supabaseEnabled,
    allRoutes,
    activeRoutes,
    isAdminUnlocked,
    unlockAdmin,
    lockAdmin,
    createRoute,
    updateRoute,
    setRouteActive,
    deleteRoute,
    addStation,
    saveStation,
    deleteStation,
    saveLineBulk,
    resetToDefaults,
    settings,
    updateSettings,
  } = useSchedule();

  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [panel, setPanel] = useState<"routes" | "stations" | "settings" | "security">("routes");
  const [activeRouteId, setActiveRouteId] = useState<string>("");
  const [draft, setDraft] = useState<
    Record<
      string,
      {
        departureTime: string;
        trafficStatus: TrafficStatus;
        adminNote: string;
        name: string;
        description: string;
      }
    >
  >({});

  const activeRoute = useMemo(
    () => allRoutes.find((r) => r.id === activeRouteId) ?? allRoutes[0],
    [allRoutes, activeRouteId],
  );

  useEffect(() => {
    if (!activeRouteId && allRoutes[0]) setActiveRouteId(allRoutes[0].id);
  }, [allRoutes, activeRouteId]);

  useEffect(() => {
    if (!activeRoute) return;
    const next: typeof draft = {};
    for (const stop of activeRoute.stations) {
      next[stop.id] = {
        departureTime: stop.defaultTime,
        trafficStatus: stop.status,
        adminNote: stop.notes,
        name: pick(stop.name, locale),
        description: pick(stop.description, locale),
      };
    }
    setDraft(next);
  }, [activeRoute, locale]);

  const totalStops = allRoutes.reduce((n, l) => n + l.stations.length, 0);

  const tryUnlock = async (e: FormEvent) => {
    e.preventDefault();
    if (await unlockAdmin(pin)) {
      setPin("");
      setPinError(false);
      toast.success(t.adminUnlocked);
    } else {
      setPinError(true);
      toast.error(t.adminPinWrong);
    }
  };

  const saveStop = async (stop: ManagedStation) => {
    const row = draft[stop.id];
    if (!row) return;
    const name =
      locale === "ar"
        ? { ...stop.name, ar: row.name }
        : locale === "de"
          ? { ...stop.name, de: row.name, en: stop.name.en }
          : { ...stop.name, en: row.name };
    const description =
      locale === "ar"
        ? { ...stop.description, ar: row.description }
        : { ...stop.description, en: row.description };
    await saveStation({
      ...stop,
      name,
      description,
      defaultTime: row.departureTime,
      status: row.trafficStatus,
      notes: row.adminNote,
    });
    toast.success(t.adminSavedStop);
  };

  const saveAll = () => {
    if (!activeRoute) return;
    saveLineBulk(
      activeRoute.stations.map((s) => ({
        stopId: s.id,
        ...(draft[s.id]
          ? {
              departureTime: draft[s.id]!.departureTime,
              trafficStatus: draft[s.id]!.trafficStatus,
              adminNote: draft[s.id]!.adminNote,
            }
          : {
              departureTime: s.defaultTime,
              trafficStatus: s.status,
              adminNote: s.notes,
            }),
      })),
    );
    toast.success(t.adminSavedLine);
  };

  const bumpTime = (stopId: string, delta: number) => {
    setDraft((prev) => {
      const cur = prev[stopId];
      if (!cur) return prev;
      return {
        ...prev,
        [stopId]: { ...cur, departureTime: shiftDepartureTime(cur.departureTime, delta) },
      };
    });
  };

  if (!isAdminUnlocked) {
    return (
      <AdminShell>
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-7"
          >
            <div className="mb-5 flex items-center gap-3">
              <span
                className="flex size-12 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10"
                style={{ color: TEAL }}
              >
                <Lock className="size-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#14B8A6]/90">
                  {t.adminBadge}
                </p>
                <h1 className="text-lg font-black text-white">{t.adminTitle}</h1>
                <p className="text-xs text-slate-400">{t.adminPinHint}</p>
              </div>
            </div>
            <form onSubmit={tryUnlock} className="space-y-3">
              <input
                type="password"
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError(false);
                }}
                placeholder="••••"
                className={cn(
                  fieldClass(pinError),
                  "py-3.5 text-center text-lg font-bold tracking-[0.28em]",
                )}
              />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-extrabold text-[#0A192F] shadow-[0_12px_30px_-12px_rgba(20,184,166,0.65)] transition hover:brightness-110"
                style={{ backgroundColor: TEAL }}
              >
                <Unlock className="size-4" />
                {t.adminUnlock}
              </button>
            </form>
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="mt-4 w-full text-center text-xs font-bold text-slate-500 transition hover:text-[#14B8A6]"
            >
              {t.goHome}
            </button>
          </motion.div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <section className="border-b border-white/5 px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-3 py-1 text-[11px] font-extrabold text-[#5eead4]">
                <Shield className="size-3.5" />
                {t.adminBadge}
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {t.adminTitle}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{t.adminLead}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-slate-300">
                <span className="me-2 size-1.5 rounded-full bg-[#14B8A6]" aria-hidden />
                {supabaseEnabled && storageMode === "supabase"
                  ? t.adminStorageCloud
                  : t.adminStorageLocal}
                {!ready ? "…" : ""}
              </span>
              <Link
                to="/"
                onClick={() => lockAdmin()}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-[#14B8A6]/35 hover:text-white"
              >
                {t.goHome}
                {dir === "rtl" ? <ArrowRight className="size-3.5" /> : null}
              </Link>
              <button
                type="button"
                onClick={() => {
                  lockAdmin();
                  toast.message(t.adminLocked);
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-rose-400/30 hover:text-rose-200"
              >
                <Lock className="size-3.5" />
                {t.adminLock}
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: t.adminKpiLines, value: `${activeRoutes.length} / ${allRoutes.length}` },
              { label: t.adminKpiStops, value: `${totalStops}` },
              { label: t.adminKpiSync, value: t.adminSyncLive },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent px-4 py-4"
              >
                <p className="text-[11px] font-bold tracking-wide text-slate-400">{kpi.label}</p>
                <p className="mt-1.5 text-lg font-extrabold text-white">{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 pb-20">
        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
          {(
            [
              { id: "routes" as const, label: t.adminRoutesTab, icon: RouteIcon },
              { id: "stations" as const, label: t.adminStationsTab, icon: Bus },
              { id: "settings" as const, label: t.adminSettingsTab, icon: Settings },
              { id: "security" as const, label: t.adminSecurityTab, icon: KeyRound },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPanel(tab.id)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all sm:flex-none",
                panel === tab.id
                  ? "bg-[#14B8A6] text-[#0A192F] shadow-[0_8px_24px_-12px_rgba(20,184,166,0.7)]"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {panel === "security" ? (
          <AdminSecurityPanel />
        ) : panel === "settings" ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-black text-white">{t.adminSettingsTitle}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{t.adminSettingsLead}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2">
                    <Clock3 className="size-4 text-[#14B8A6]" />
                    <p className="text-sm font-extrabold text-white">{t.adminShowOfficeHours}</p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{t.adminShowOfficeHoursHint}</p>
                  <p
                    className={cn(
                      "mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
                      settings.showOfficeHours
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-slate-500/15 text-slate-400",
                    )}
                  >
                    {settings.showOfficeHours ? t.adminOfficeHoursShown : t.adminOfficeHoursHidden}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showOfficeHours}
                  aria-label={t.adminShowOfficeHours}
                  onClick={async () => {
                    const next = !settings.showOfficeHours;
                    await updateSettings({ showOfficeHours: next });
                    toast.success(
                      next ? t.adminOfficeHoursShown : t.adminOfficeHoursHidden,
                    );
                  }}
                  className={cn(
                    "relative inline-flex h-11 w-[4.5rem] shrink-0 items-center rounded-full border transition-all",
                    settings.showOfficeHours
                      ? "border-[#14B8A6]/50 bg-[#14B8A6]/20"
                      : "border-white/10 bg-white/[0.06]",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1/2 size-8 -translate-y-1/2 rounded-full bg-white shadow-md transition-all",
                      settings.showOfficeHours ? "end-1.5" : "start-1.5",
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        ) : panel === "routes" ? (
          <RoutesManager
            routes={allRoutes}
            onCreate={async () => {
              const route = await createRoute();
              setActiveRouteId(route.id);
              setPanel("stations");
              toast.success(t.adminRouteCreated);
            }}
            onToggle={async (route, next) => {
              await setRouteActive(route.id, next);
              toast.success(t.adminRouteUpdated);
            }}
            onSave={async (route, patch) => {
              await updateRoute(route.id, patch);
              toast.success(t.adminRouteUpdated);
            }}
            onDelete={async (route) => {
              if (!window.confirm(`${t.adminDeleteRoute}: ${pick(route.name, locale)}?`)) return;
              await deleteRoute(route.id);
              toast.message(t.adminRouteDeleted);
            }}
          />
        ) : (
          <>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {allRoutes.map((route) => {
                const active = activeRoute?.id === route.id;
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => setActiveRouteId(route.id)}
                    className={cn(
                      "shrink-0 rounded-2xl border px-3.5 py-2.5 text-start text-xs font-bold transition-all sm:text-sm",
                      active
                        ? "border-[#14B8A6]/45 bg-[#14B8A6]/12 text-[#99f6e4]"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20",
                      !route.isActive && "opacity-50",
                    )}
                  >
                    <span className="block">
                      #{route.routeNumber} · {pick(route.name, locale)}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-semibold opacity-70">
                      {t.stopsCount(route.stations.length)}
                      {!route.isActive ? ` · ${t.adminRouteInactive}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeRoute ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                    <Bus className="size-4 text-[#14B8A6]" />
                    {pick(activeRoute.name, locale)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await addStation(activeRoute.id);
                        toast.success(t.adminStationAdded);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#14B8A6]/35 bg-[#14B8A6]/10 px-3 py-2 text-xs font-extrabold text-[#5eead4]"
                    >
                      <Plus className="size-3.5" />
                      {t.adminAddStation}
                    </button>
                    <button
                      type="button"
                      onClick={saveAll}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#14B8A6] px-3 py-2 text-xs font-extrabold text-[#0A192F]"
                    >
                      <Save className="size-3.5" />
                      {t.adminSaveAll}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await resetToDefaults();
                        toast.message(t.adminResetAllToast);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-extrabold text-rose-200"
                    >
                      <RefreshCcw className="size-3.5" />
                      {t.adminResetAll}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {activeRoute.stations
                    .slice()
                    .sort((a, b) => a.stationIndex - b.stationIndex)
                    .map((stop, index) => {
                      const row = draft[stop.id] ?? {
                        departureTime: stop.defaultTime,
                        trafficStatus: stop.status,
                        adminNote: stop.notes,
                        name: pick(stop.name, locale),
                        description: pick(stop.description, locale),
                      };
                      return (
                        <motion.div
                          key={stop.id}
                          layout
                          className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm"
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-xs font-black text-[#5eead4]">
                              {index + 1}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void saveStop(stop)}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#14B8A6] px-2.5 py-1.5 text-[11px] font-extrabold text-[#0A192F]"
                              >
                                <Check className="size-3.5" />
                                {t.adminSaveStop}
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm(t.adminDeleteStation)) return;
                                  await deleteStation(stop.id);
                                  toast.message(t.adminStationDeleted);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-extrabold text-rose-200"
                              >
                                <Trash2 className="size-3.5" />
                                {t.adminDeleteStation}
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[10px] font-bold text-slate-500">
                                {t.adminStationName}
                              </label>
                              <input
                                value={row.name}
                                onChange={(e) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    [stop.id]: { ...row, name: e.target.value },
                                  }))
                                }
                                className={cn(fieldClass(), "font-bold")}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-bold text-slate-500">
                                {t.adminStationDesc}
                              </label>
                              <input
                                value={row.description}
                                onChange={(e) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    [stop.id]: { ...row, description: e.target.value },
                                  }))
                                }
                                className={fieldClass()}
                              />
                            </div>
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div>
                              <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                <Clock3 className="size-3 text-[#14B8A6]" />
                                {t.adminDepartureTime}
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => bumpTime(stop.id, -5)}
                                  className="rounded-lg border border-white/10 px-2 py-2 text-[11px] font-bold text-slate-300 hover:bg-white/[0.04]"
                                >
                                  -5
                                </button>
                                <input
                                  value={row.departureTime}
                                  onChange={(e) =>
                                    setDraft((prev) => ({
                                      ...prev,
                                      [stop.id]: { ...row, departureTime: e.target.value },
                                    }))
                                  }
                                  className={cn(fieldClass(), "text-center font-bold")}
                                />
                                <button
                                  type="button"
                                  onClick={() => bumpTime(stop.id, 5)}
                                  className="rounded-lg border border-white/10 px-2 py-2 text-[11px] font-bold text-slate-300 hover:bg-white/[0.04]"
                                >
                                  +5
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-[10px] font-bold text-slate-500">
                                {t.adminTrafficStatus}
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {STATUS_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() =>
                                      setDraft((prev) => ({
                                        ...prev,
                                        [stop.id]: { ...row, trafficStatus: opt.id },
                                      }))
                                    }
                                    className={cn(
                                      "rounded-full border px-2.5 py-1 text-[10px] font-extrabold transition-all",
                                      row.trafficStatus === opt.id
                                        ? opt.tone
                                        : "border-white/10 text-slate-500 hover:border-white/20",
                                    )}
                                  >
                                    {statusLabel(opt.id, t)}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-[10px] font-bold text-slate-500">
                                {t.adminDriverNote}
                              </label>
                              <input
                                value={row.adminNote}
                                onChange={(e) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    [stop.id]: { ...row, adminNote: e.target.value },
                                  }))
                                }
                                placeholder={t.adminDriverNotePlaceholder}
                                className={fieldClass()}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </>
            ) : null}
          </>
        )}
      </main>
    </AdminShell>
  );
}

function RoutesManager({
  routes,
  onCreate,
  onToggle,
  onSave,
  onDelete,
}: {
  routes: ManagedRoute[];
  onCreate: () => void;
  onToggle: (route: ManagedRoute, next: boolean) => void;
  onSave: (route: ManagedRoute, patch: Partial<ManagedRoute>) => void;
  onDelete: (route: ManagedRoute) => void;
}) {
  const { locale, t } = useI18n();
  const [edits, setEdits] = useState<Record<string, { routeNumber: string; name: string }>>({});

  useEffect(() => {
    const next: typeof edits = {};
    for (const r of routes) {
      next[r.id] = { routeNumber: r.routeNumber, name: pick(r.name, locale) };
    }
    setEdits(next);
  }, [routes, locale]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#14B8A6] px-4 py-2.5 text-sm font-extrabold text-[#0A192F] shadow-[0_12px_28px_-14px_rgba(20,184,166,0.7)]"
        >
          <Plus className="size-4" />
          {t.adminAddRoute}
        </button>
      </div>

      {routes.map((route) => {
        const edit = edits[route.id] ?? {
          routeNumber: route.routeNumber,
          name: pick(route.name, locale),
        };
        return (
          <div
            key={route.id}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm"
          >
            <div className="grid gap-3 md:grid-cols-[7rem_1fr_auto] md:items-end">
              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500">
                  {t.adminRouteNumber}
                </label>
                <input
                  value={edit.routeNumber}
                  onChange={(e) =>
                    setEdits((prev) => ({
                      ...prev,
                      [route.id]: { ...edit, routeNumber: e.target.value },
                    }))
                  }
                  className={cn(fieldClass(), "text-center font-bold")}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500">
                  {t.adminRouteName}
                </label>
                <input
                  value={edit.name}
                  onChange={(e) =>
                    setEdits((prev) => ({
                      ...prev,
                      [route.id]: { ...edit, name: e.target.value },
                    }))
                  }
                  className={cn(fieldClass(), "font-bold")}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={route.isActive}
                    onChange={(e) => onToggle(route, e.target.checked)}
                    className="size-4 accent-[#14B8A6]"
                  />
                  <span className={route.isActive ? "text-emerald-300" : "text-slate-500"}>
                    {route.isActive ? t.adminRouteActive : t.adminRouteInactive}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onSave(route, {
                      routeNumber: edit.routeNumber,
                      name:
                        locale === "ar"
                          ? { ...route.name, ar: edit.name }
                          : { ...route.name, en: edit.name },
                      badge:
                        locale === "ar"
                          ? { ...route.badge, ar: `الخط ${edit.routeNumber}` }
                          : { ...route.badge, en: `Line ${edit.routeNumber}` },
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-xl bg-[#14B8A6] px-3 py-2 text-xs font-extrabold text-[#0A192F]"
                >
                  <Save className="size-3.5" />
                  {t.adminSaveStop}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(route)}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-extrabold text-rose-200"
                >
                  <Trash2 className="size-3.5" />
                  {t.adminDeleteRoute}
                </button>
              </div>
            </div>
            <p className="mt-3 text-[11px] font-semibold text-slate-500">
              slug: <span className="font-mono text-slate-300">{route.slug}</span>
              {" · "}
              {t.stopsCount(route.stations.length)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
