import { Languages } from "lucide-react";
import { LANGS, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ overlay, className }: { overlay?: boolean; className?: string }) {
  const { lang, setLang, t } = useT();
  return (
    <div role="group" aria-label={t("language")} className={cn("inline-flex items-center gap-0.5 rounded-full border p-0.5 text-xs", overlay ? "border-navy-foreground/25 bg-navy-foreground/10 text-navy-foreground backdrop-blur" : "bg-card", className)}>
      <Languages className="mx-1 size-3.5 opacity-70" aria-hidden />
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          title={l.label}
          aria-pressed={lang === l.code}
          onClick={() => setLang(l.code)}
          className={cn("rounded-full px-2 py-1 font-semibold transition-colors", lang === l.code ? "bg-primary text-primary-foreground" : overlay ? "hover:bg-navy-foreground/15" : "hover:bg-accent")}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
