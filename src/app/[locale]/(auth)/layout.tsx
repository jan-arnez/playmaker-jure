import type { ReactNode } from "react";
import Logo from "@/components/shared/logo";
import { Link } from "@/i18n/navigation";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="bg-muted flex h-full flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="mx-auto">
          <Logo />
        </Link>

        {children}
      </div>
    </div>
  );
}
