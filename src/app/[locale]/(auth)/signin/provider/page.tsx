import { ProviderLoginForm } from "@/modules/provider/components/forms/provider-login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProviderLoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome Back, Provider</CardTitle>
        <CardDescription>Sign in to manage your facilities</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">
        <ProviderLoginForm />
      </CardContent>
    </Card>
  );
}
