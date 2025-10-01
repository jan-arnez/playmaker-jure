import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { PlatformLoginForm } from "@/modules/auth/components/forms/platform-login-form";
import { GoogleButton } from "@/modules/auth/components/google-button";

export default function PlatformLoginPage() {
  const t = useTranslations("AuthModule.platformLoginPage");

  return (
    <>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-6">
          <GoogleButton />
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-card text-muted-foreground relative z-10 px-2">
              {t("orContinueWith")}
            </span>
          </div>
          <PlatformLoginForm />
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        {t("termsText")} <Link href="#">{t("termsOfService")}</Link> {t("and")}{" "}
        <Link href="#">{t("privacyPolicy")}</Link>.
      </div>
    </>
  );
}
