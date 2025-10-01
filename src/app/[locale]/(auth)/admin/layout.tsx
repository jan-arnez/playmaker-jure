import { getLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";
import { redirect } from "@/i18n/navigation";
import { getServerSession } from "@/modules/auth/lib/get-session";

export default async function AdminAuthLayout({ children }: PropsWithChildren) {
  const session = await getServerSession();
  const locale = await getLocale();

  const user = session?.user;

  if (user) redirect({ href: "/admin", locale });

  return children;
}
