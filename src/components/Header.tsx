import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Bus, ChevronDown, Globe, Moon, Search, Sun, X } from "lucide-react";
import brandLogo from "@/assets/albridge-logo.png";
import gjuLogo from "@/assets/gju-logo.png";
import { RoutesMapMenu } from "@/components/RoutesMapMenu";
import { useSchedule } from "@/context/ScheduleContext";
import { pick, useI18n, LOCALES, localeNativeName, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DARK_KEY = "albreeji-dark";

export function Header() {
  const { locale, dir, t, setLocale } = useI18n();
  const { activeLiveLines } = useSchedule();
  const routeLines = activeLiveLines;
  const [openLines, setOpenLines] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [openLang, setOpenLang] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpenLines(false);
    setOpenSearch(false);
    setOpenLang(false);
  }, [pathname]);

  useEffect(() => {
    let stored = false;
    try {
      stored = window.localStorage.getItem(DARK_KEY) === "1";
    } catch {
      stored = false;
    }
    setDark(stored);
    document.documentElement.classList.toggle("dark", stored);
  }, []);

  const applyDark = (next: boolean) => {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem(DARK_KEY, next ? "1" : "0");
    } catch {
      /* storage can be blocked in previews / private mode */
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!openLines && !openLang) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (openLines && dropdownRef.current && !dropdownRef.current.contains(target)) {
        setOpenLines(false);
      }
      if (openLang && langRef.current && !langRef.current.contains(target)) {
        setOpenLang(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenLines(false);
        setOpenLang(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [openLines, openLang]);

  const q = query.trim().toLowerCase();
  const results = q
    ? routeLines.flatMap((l) =>
        l.stops
          .filter(
            (s) =>
              s.name.ar.toLowerCase().includes(q) ||
              s.name.en.toLowerCase().includes(q) ||
              pick(s.name, locale).toLowerCase().includes(q),
          )
          .map((s) => ({ line: l, stop: s })),
      )
    : [];

  const utilBtn =
    "flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-slate-100 text-slate-600 shadow-sm transition-colors hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-amber-400";

  const headerH = "h-16 sm:h-[4.5rem]";

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-all duration-300",
          headerH,
          scrolled
            ? "border-slate-200/80 bg-white/90 shadow-lg shadow-black/5 dark:border-slate-800/80 dark:bg-slate-950/90"
            : "border-slate-200/60 bg-white/80 dark:border-slate-800/60 dark:bg-slate-950/80",
        )}
      >
        <div className="relative flex h-full w-full max-w-none items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="relative z-10 flex shrink-0 items-center gap-2.5 sm:gap-3.5"
            aria-label={t.brand}
          >
            <motion.img
              src={brandLogo}
              alt={t.brand}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="h-8 w-auto object-contain sm:h-9"
            />
            <span className="hidden h-7 w-px bg-slate-200 sm:block dark:bg-slate-700" aria-hidden />
            <motion.img
              src={gjuLogo}
              alt={t.partnerUniversityAlt}
              title={t.partnerUniversity}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="hidden h-8 w-auto object-contain sm:block sm:h-9"
            />
          </Link>

          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
            <div ref={dropdownRef} className="pointer-events-auto relative hidden md:block">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                aria-expanded={openLines}
                aria-haspopup="menu"
                onClick={() => setOpenLines((v) => !v)}
                className={cn(
                  "flex h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-bold shadow-sm transition-all sm:px-5",
                  openLines
                    ? "border-amber-500/40 bg-amber-500/10 text-slate-900 dark:text-white"
                    : "border-slate-200/70 bg-slate-100/80 text-slate-800 hover:border-amber-500/30 hover:bg-amber-500/10 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100",
                )}
              >
                <Bus className="size-4 text-amber-500" />
                <span>{t.linesNav}</span>
                <ChevronDown
                  className={cn(
                    "size-4 text-slate-400 transition-transform duration-300",
                    openLines && "rotate-180 text-amber-500",
                  )}
                />
              </motion.button>

              <AnimatePresence>
                {openLines && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2"
                  >
                    <RoutesMapMenu lines={routeLines} onSelect={() => setOpenLines(false)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-1.5 sm:gap-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={t.search}
              onClick={() => setOpenSearch(true)}
              className={utilBtn}
            >
              <Search className="size-4" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.05, rotate: dark ? 16 : -12 }}
              whileTap={{ scale: 0.95 }}
              aria-label={dark ? t.lightMode : t.darkMode}
              onClick={() => applyDark(!dark)}
              className={utilBtn}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={dark ? "sun" : "moon"}
                  initial={{ opacity: 0, rotate: -40, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 40, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                  className="flex"
                >
                  {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <div ref={langRef} className="relative">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                aria-label={t.languageAria}
                aria-expanded={openLang}
                aria-haspopup="listbox"
                onClick={() => {
                  setOpenLang((v) => !v);
                  setOpenLines(false);
                }}
                className="flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200/70 bg-slate-100/80 px-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-600 sm:px-3 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:text-amber-400"
              >
                <Globe className="size-3.5" />
                <span className="hidden sm:inline">{localeNativeName[locale]}</span>
                <ChevronDown
                  className={cn(
                    "size-3.5 text-slate-400 transition-transform duration-200",
                    openLang && "rotate-180 text-amber-500",
                  )}
                />
              </motion.button>

              <AnimatePresence>
                {openLang && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    role="listbox"
                    aria-label={t.language}
                    className="absolute end-0 top-full z-50 mt-2 min-w-[9.5rem] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95"
                  >
                    {LOCALES.map((code) => {
                      const active = code === locale;
                      return (
                        <button
                          key={code}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            setLocale(code as Locale);
                            setOpenLang(false);
                          }}
                          className={cn(
                            "flex w-full items-center rounded-xl px-3 py-2 text-start text-xs font-bold transition-colors",
                            active
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                          )}
                        >
                          {localeNativeName[code]}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/admin"
              className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-amber-500/50 bg-amber-50 px-3 text-[11px] font-extrabold text-amber-700 shadow-sm transition-colors hover:bg-amber-500 hover:text-slate-950 sm:px-4 sm:text-xs dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500 dark:hover:text-slate-950"
            >
              {t.adminFooterLink}
            </Link>

            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setOpenLines(true)}
              className="flex size-10 items-center justify-center rounded-full border border-slate-200/70 bg-slate-100/80 text-slate-800 shadow-sm md:hidden dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100"
              aria-label={t.linesShort}
            >
              <Bus className="size-4 text-amber-500" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Offset for fixed header */}
      <div className={cn("shrink-0 transition-all duration-300", headerH)} aria-hidden />

      {/* Mobile lines drawer */}
      <AnimatePresence>
        {openLines && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm md:hidden"
            onClick={() => setOpenLines(false)}
          >
            <motion.aside
              initial={{ x: dir === "rtl" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: dir === "rtl" ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-y-0 start-0 w-[88%] max-w-sm border-e border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-400">{t.linesSectionBadge}</p>
                  <h2 className="text-lg font-extrabold text-white">{t.linesNav}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenLines(false)}
                  aria-label={t.close}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-200"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <img src={brandLogo} alt="" className="h-8 w-auto object-contain" />
                <span className="h-7 w-px bg-white/15" aria-hidden />
                <img src={gjuLogo} alt="" className="h-8 w-auto object-contain" />
              </div>

              <RoutesMapMenu
                compact
                hideHeader
                lines={routeLines}
                onSelect={() => setOpenLines(false)}
                className="border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
              />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <AnimatePresence>
        {openSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/50 p-4 pt-28 backdrop-blur-sm"
            onClick={() => setOpenSearch(false)}
          >
            <motion.div
              initial={{ y: -16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -16, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pe-4 ps-10 text-sm text-slate-900 outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
                {results.slice(0, 12).map(({ line, stop }) => (
                  <Link
                    key={stop.id}
                    to="/lines/$slug"
                    params={{ slug: line.slug }}
                    search={{ stop: stop.order }}
                    className="block rounded-xl p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">
                      {pick(stop.name, locale)}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {pick(line.title, locale)}
                    </span>
                  </Link>
                ))}
                {query.trim() && results.length === 0 && (
                  <p className="p-3 text-sm text-slate-500 dark:text-slate-400">{t.noResults}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
