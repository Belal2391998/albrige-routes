import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Clock3, MapPinned, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { CONTACT_PHONES, WHATSAPP_URL } from "@/lib/contact";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DISPLAY_PHONES = ["077 82 55551", "078 17 914 09"] as const;

const NAVY = "#0A192F";
const TEAL = "#14B8A6";

/* ─── Shared inquiry form (contact page) ─── */

function IconShell({ children }: { children: ReactNode }) {
  return (
    <span
      className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-teal-400/30 bg-teal-500/10 text-teal-300"
      aria-hidden
    >
      {children}
    </span>
  );
}

export function ContactInquirySection({ className }: { className?: string }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast.error(t.contactFormRequired);
      return;
    }
    setSending(true);
    const body = [`الاسم: ${name.trim()}`, `الهاتف: ${phone.trim()}`, "", message.trim()].join(
      "\n",
    );
    const base = WHATSAPP_URL.split("?")[0];
    window.open(`${base}?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
    toast.success(t.contactSentToast);
    setName("");
    setPhone("");
    setMessage("");
    setSending(false);
  };

  const fieldClass = cn(
    "w-full border-0 border-b border-white/15 bg-transparent py-2.5 text-[15px] text-white outline-none",
    "placeholder:text-slate-500 transition focus:border-teal-400/70",
  );

  return (
    <div className={cn("grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20", className)}>
      <div className="flex flex-col justify-center gap-8">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-300/90">
            {t.contactTitle}
          </p>
          <h2 className="text-xl font-bold leading-snug text-white sm:text-2xl">
            {t.contactFormTitle}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            {t.contactFormLead}
          </p>
        </div>
        <ul className="space-y-6">
          <li className="flex items-start gap-3.5">
            <IconShell>
              <Phone className="size-4" />
            </IconShell>
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t.contactPhonesLabel}
              </p>
              <p
                className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-medium text-white"
                dir="ltr"
              >
                {CONTACT_PHONES.map((p, i) => (
                  <span key={p.id} className="inline-flex items-center gap-2">
                    {i > 0 && <span className="text-slate-600">—</span>}
                    <a href={p.href} className="transition hover:text-teal-300">
                      {DISPLAY_PHONES[i] ?? p.display}
                    </a>
                  </span>
                ))}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3.5">
            <IconShell>
              <Clock3 className="size-4" />
            </IconShell>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t.contactHoursLabel}
              </p>
              <p className="text-[15px] font-medium text-white">{t.contactHoursValue}</p>
            </div>
          </li>
          <li className="flex items-start gap-3.5">
            <IconShell>
              <MapPinned className="size-4" />
            </IconShell>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t.contactLocationLabel}
              </p>
              <p className="text-[15px] font-medium leading-relaxed text-white">
                {t.contactLocationValue}
              </p>
            </div>
          </li>
        </ul>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col justify-center space-y-7" noValidate>
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {t.contactNameLabel}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.contactNamePlaceholder}
            className={fieldClass}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {t.contactPhoneLabel}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t.contactPhonePlaceholder}
            className={fieldClass}
            dir="ltr"
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {t.contactMessageLabel}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.contactMessagePlaceholder}
            rows={3}
            className={cn(fieldClass, "resize-none")}
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={sending}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-7 py-3 text-sm font-bold text-[#0A192F]",
              "bg-[#14B8A6] transition hover:bg-teal-400 disabled:opacity-60",
            )}
          >
            <Send className="size-4" />
            {t.contactSubmit}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Classic corporate footer — navy + turquoise */
export function SiteFooter() {
  const { t, locale } = useI18n();

  return (
    <footer className="relative mt-auto border-t border-white/5" style={{ backgroundColor: NAVY }}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(20,184,166,0.08),transparent_50%)]"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-14 lg:grid-cols-[1.2fr_1fr_1fr] lg:gap-12 lg:px-10">
        {/* Brand + accreditation */}
        <div className="space-y-4" dir="rtl">
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: TEAL }}>
            Albrige
          </p>
          <h2 className="text-xl font-bold text-white sm:text-2xl">{t.brand}</h2>
          <p className="max-w-sm text-sm leading-relaxed text-slate-400">{t.brandSub}</p>
          <p className="pt-2 text-sm font-medium leading-relaxed text-slate-200">
            {locale === "ar" ? (
              <>
                {t.footerAccreditedLine1}
                <br />
                <span className="font-bold text-white">{t.footerAccreditedLine2}</span>
              </>
            ) : (
              <>
                {t.footerAccreditedLine1}{" "}
                <span className="font-bold text-white">{t.footerAccreditedLine2}</span>
              </>
            )}
          </p>
        </div>

        {/* Contact */}
        <div className="space-y-5" dir="rtl">
          <h3 className="text-sm font-bold tracking-wide text-white">{t.contactTitle}</h3>
          <ul className="space-y-3.5 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <Phone
                className="mt-0.5 size-4 shrink-0"
                style={{ color: TEAL }}
                strokeWidth={1.75}
              />
              <div className="space-y-1" dir="ltr">
                {CONTACT_PHONES.map((p, i) => (
                  <a
                    key={p.id}
                    href={p.href}
                    className="block tabular-nums transition hover:text-teal-300"
                  >
                    {DISPLAY_PHONES[i] ?? p.display}
                  </a>
                ))}
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Clock3
                className="mt-0.5 size-4 shrink-0"
                style={{ color: TEAL }}
                strokeWidth={1.75}
              />
              <span>{t.contactHoursValue}</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPinned
                className="mt-0.5 size-4 shrink-0"
                style={{ color: TEAL }}
                strokeWidth={1.75}
              />
              <span>{t.contactLocationValue}</span>
            </li>
          </ul>
        </div>

        {/* Quick links + WhatsApp */}
        <div className="space-y-5" dir="rtl">
          <h3 className="text-sm font-bold tracking-wide text-white">{t.footerInquiriesTitle}</h3>
          <div className="flex flex-col gap-2.5">
            <Link
              to="/"
              hash="lines"
              className="text-sm text-slate-400 transition hover:text-teal-300"
            >
              {t.linesNav}
            </Link>
            <Link to="/contact" className="text-sm text-slate-400 transition hover:text-teal-300">
              {t.contactNav}
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-2 inline-flex w-fit items-center justify-center rounded-lg px-5 py-2.5 text-sm font-bold",
                "bg-[#14B8A6] text-[#0A192F] transition hover:bg-teal-400",
              )}
            >
              {t.contactWhatsApp}
            </a>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <p className="px-5 py-4 text-center text-xs tracking-wide text-slate-500 sm:text-[13px]">
          © 2026 شركة البريجي — شبكة خطوط النقل الذكية — Albrige
        </p>
      </div>
    </footer>
  );
}
