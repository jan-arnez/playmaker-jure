import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminLoginForm } from "@/modules/auth/components/forms/admin-login-form";

export default function AdminLoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome Back, Admin</CardTitle>
        <CardDescription>Sign in to access the admin dashboard</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">
        <AdminLoginForm />
      </CardContent>
    </Card>
  );
}
