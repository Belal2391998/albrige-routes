import { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useSchedule } from "@/context/ScheduleContext";

/** Global shortcut + lock admin session when leaving /admin (e.g. home). */
export function AdminShortcut() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { lockAdmin, isAdminUnlocked } = useSchedule();
  const prevPath = useRef(pathname);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        void navigate({ to: "/admin" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  useEffect(() => {
    const wasAdmin = prevPath.current === "/admin" || prevPath.current.startsWith("/admin/");
    const nowHomeOrElsewhere = pathname !== "/admin" && !pathname.startsWith("/admin/");
    if (wasAdmin && nowHomeOrElsewhere && isAdminUnlocked) {
      lockAdmin();
    }
    prevPath.current = pathname;
  }, [pathname, isAdminUnlocked, lockAdmin]);

  return null;
}
