import { Star } from "lucide-react";
import { fleetServiceCards, type FleetServiceCard } from "@/data/transportData";
import { pick, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function CinemaCard({ card }: { card: FleetServiceCard }) {
  const { locale, t } = useI18n();
  const score = card.rating.toFixed(1);

  return (
    <article
      aria-label={`${pick(card.title, locale)} — ${t.fleetRatingLabel} ${score}`}
      className={cn(
        "group relative isolate h-full w-full overflow-hidden rounded-xl",
        "border border-white/10 bg-[#121212]",
        "shadow-[0_14px_32px_-18px_rgba(0,0,0,0.75)]",
        "transition-[border-color,box-shadow] duration-300",
        "hover:border-white/25 hover:shadow-[0_18px_40px_-16px_rgba(0,0,0,0.85)]",
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <img
          src={card.image}
          alt=""
          loading="lazy"
          draggable={false}
          className="size-full object-cover object-[center_35%] transition-transform duration-300 ease-out will-change-transform group-hover:scale-105"
        />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className="size-3 fill-[#F5C542] text-[#F5C542] sm:size-3.5"
                strokeWidth={1.5}
              />
            ))}
            <span className="ms-1 text-xs font-extrabold tabular-nums text-amber-200 sm:text-sm">
              {score}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function MarqueeRow({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <div className="flex shrink-0 gap-4 pe-4 sm:gap-5 sm:pe-5" aria-hidden={ariaHidden || undefined}>
      {fleetServiceCards.map((card) => (
        <div
          key={`${ariaHidden ? "dup" : "src"}-${card.id}`}
          className="w-56 shrink-0 sm:w-72 md:w-80 lg:w-[22rem]"
        >
          <CinemaCard card={card} />
        </div>
      ))}
    </div>
  );
}

export function FleetServicesCarousel() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-[#0A192F] py-14 sm:py-16" aria-label={t.fleetTitle}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.1),transparent_55%)]"
        aria-hidden
      />

      <div className="relative" dir="ltr">
        <div className="flex w-max animate-fleet-marquee">
          <MarqueeRow />
          <MarqueeRow ariaHidden />
        </div>
      </div>
    </section>
  );
}
