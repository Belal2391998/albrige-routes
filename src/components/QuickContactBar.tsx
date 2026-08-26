import { Phone } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { CONTACT_PHONES, WHATSAPP_URL } from "@/lib/contact";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function QuickContactBar() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/admin")) return null;

  const aboveDock = pathname.startsWith("/lines/");

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-50 w-full px-3 md:w-auto md:px-0",
        aboveDock
          ? "bottom-[7.5rem] md:bottom-6"
          : "bottom-[max(0.75rem,env(safe-area-inset-bottom))] md:bottom-6",
        "inset-x-0 md:inset-x-auto md:end-auto md:right-5",
      )}
    >
      <nav
        aria-label={t.contactAria}
        className="pointer-events-auto mx-auto flex max-w-lg items-center gap-2 rounded-2xl border border-white/10 bg-[#121212cc] p-2 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.65)] backdrop-blur-md md:mx-0 md:max-w-none md:flex-col md:items-stretch md:rounded-3xl md:p-2.5"
      >
        <p className="hidden px-2 pt-1 text-[11px] font-bold leading-snug text-white/80 md:block">
          {t.contactLead}
        </p>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex min-h-11 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#25D366] px-3 text-sm font-extrabold text-white shadow-[0_0_18px_rgba(37,211,102,0.35)] transition hover:bg-[#20bd5a] hover:shadow-[0_0_28px_rgba(37,211,102,0.55)] md:min-h-12 md:flex-none"
        >
          <span
            className="pointer-events-none absolute inset-0 animate-pulse bg-[#25D366]/30 group-hover:animate-none"
            aria-hidden
          />
          <WhatsAppIcon className="relative size-5 shrink-0" />
          <span className="relative truncate">{t.contactWhatsApp}</span>
        </a>

        <div className="flex min-w-0 flex-1 gap-1.5 md:flex-none md:flex-col">
          {CONTACT_PHONES.map((phone) => (
            <a
              key={phone.id}
              href={phone.href}
              className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 text-[11px] font-bold text-white/95 transition hover:border-amber-400/40 hover:bg-white/10 sm:text-xs md:min-h-10 md:justify-start md:px-3"
            >
              <Phone className="size-3.5 shrink-0 text-amber-300" />
              <span className="truncate tabular-nums tracking-wide" dir="ltr">
                {phone.display}
              </span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function FooterContactStrip() {
  const { t } = useI18n();

  return (
    <section className="border-y border-white/10 bg-[#121212] px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-start">
        <div>
          <p className="text-sm font-extrabold text-white">{t.contactTitle}</p>
          <p className="mt-1 text-xs font-medium text-white/65 sm:text-sm">{t.contactLead}</p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-extrabold text-white shadow-[0_0_18px_rgba(37,211,102,0.3)] transition hover:bg-[#20bd5a] hover:shadow-[0_0_26px_rgba(37,211,102,0.5)]"
          >
            <WhatsAppIcon className="size-5" />
            {t.contactWhatsApp}
          </a>
          {CONTACT_PHONES.map((phone) => (
            <a
              key={phone.id}
              href={phone.href}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold text-white backdrop-blur-md transition hover:border-amber-400/40 hover:bg-white/10"
            >
              <Phone className="size-4 text-amber-300" />
              <span className="tabular-nums" dir="ltr">
                {phone.display}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
