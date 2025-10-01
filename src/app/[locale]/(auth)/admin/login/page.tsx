import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminLoginForm } from "@/modules/auth/components/forms/admin-login-form";

export default function AdminLoginPage() {
  const t = useTranslations("AuthModule.adminLoginPage");

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">
        <AdminLoginForm />
      </CardContent>
    </Card>
  );
}
