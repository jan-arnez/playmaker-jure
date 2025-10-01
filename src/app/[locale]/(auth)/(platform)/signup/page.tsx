import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { PlatformSignupForm } from "@/modules/auth/components/forms/platform-signup-form";
import { GoogleButton } from "@/modules/auth/components/google-button";

export default function PlatformSignupPage() {
  const t = useTranslations("AuthModule.platformSignupPage");

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")} </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-6">
          <GoogleButton context="signup" />
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-card text-muted-foreground relative z-10 px-2">
              {t("orContinueWith")}
            </span>
          </div>
          <PlatformSignupForm />
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        {t("termsText")} <Link href="#">{t("termsOfService")}</Link> {t("and")}{" "}
        <Link href="#">{t("privacyPolicy")}</Link>.
      </div>
    </div>
  );
}
