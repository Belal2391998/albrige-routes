import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { ContactInquirySection } from "@/components/SiteFooter";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تواصل معنا | شركة البريجي للنقل" },
      {
        name: "description",
        content: "تواصل مع إدارة خطوط البريجي للاستفسارات والمواعيد والاشتراكات.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();

  useEffect(() => {
    document.title = t.contactMetaTitle;
  }, [t]);

  return (
    <div className="min-h-screen bg-[#0A192F] text-white">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
        <ContactInquirySection />
        <p className="mt-12 text-center text-sm text-slate-500">
          <Link to="/" className="transition hover:text-teal-300">
            {t.goHome}
          </Link>
        </p>
      </main>
    </div>
  );
}
