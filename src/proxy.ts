import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { RouteProtection } from "./lib/route-protection";

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // Apply i18n middleware first
  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
