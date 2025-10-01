import { useTranslations } from "next-intl";

export function PlatformFooter() {
  const t = useTranslations("PlatformModule.platformFooter");
  const currentYear = new Date().getFullYear();

  return (
    <div className="p-6 bg-secondary text-secondary-foreground">
      <div className="container">
        <div className="text-center text-sm opacity-70">
          {t("copyright", { year: currentYear })}
        </div>
      </div>
    </div>
  );
}
