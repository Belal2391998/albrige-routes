import { useState, type FormEvent } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { changeAdminPassword } from "@/lib/adminAuth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AdminSecurityPanel() {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await changeAdminPassword({
        currentPassword,
        newPassword,
        confirmPassword: confirmNew,
      });
      if (!result.ok) {
        const map = {
          password: t.adminPinWrong,
          mismatch: t.adminSecurityPasswordMismatch,
          weak: t.adminSecurityPasswordWeak,
        } as const;
        toast.error(map[result.error]);
        return;
      }
      toast.success(t.adminSecurityPasswordChanged);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNew("");
    } finally {
      setBusy(false);
    }
  };

  const fieldClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#14B8A6]/50 focus:ring-2 focus:ring-[#14B8A6]/20";

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14B8A6]">
          <KeyRound className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-extrabold text-white">{t.adminSecurityPasswordTitle}</h2>
          <p className="mt-1 text-sm text-slate-400">{t.adminSecurityPasswordLead}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[11px] font-bold text-slate-500">
            {t.adminSecurityCurrentPassword}
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={fieldClass}
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-500">
            {t.adminSecurityNewPassword}
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={fieldClass}
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-500">
            {t.adminSecurityConfirmPassword}
          </label>
          <input
            type="password"
            value={confirmNew}
            onChange={(e) => setConfirmNew(e.target.value)}
            className={fieldClass}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-[#0A192F]",
              "bg-[#14B8A6] transition hover:brightness-110 disabled:opacity-60",
            )}
          >
            <ShieldCheck className="size-4" />
            {t.adminSecurityRequestChange}
          </button>
        </div>
      </form>
    </div>
  );
}
