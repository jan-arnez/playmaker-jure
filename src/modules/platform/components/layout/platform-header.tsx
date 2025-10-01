import { useTranslations } from "next-intl";
import Logo from "@/components/shared/logo";
import { Link } from "@/i18n/navigation";

export function PlatformHeader() {
  const t = useTranslations("PlatformModule.platformHeader");

  return (
    <>
      <div className="bg-muted h-10">
        <div className="container h-full flex items-center justify-end gap-6">
          <div className="text-sm">
            <Link href="/admin" className="font-medium hover:underline">
              {t("admin")}
            </Link>
          </div>
        </div>
      </div>
      <div className="sticky top-0 h-20 bg-background z-50 border-b">
        <div className="container flex items-center h-full gap-x-6">
          <Link href="/" className="text-3xl font-medium">
            <Logo />
          </Link>
          <div className="w-full text-center">{t("navigation")}</div>
          <Link href="/facilities">{t("facilities")}</Link>
        </div>
      </div>
    </>
  );
}
