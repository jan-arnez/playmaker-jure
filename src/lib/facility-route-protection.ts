import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { checkFacilityAccess } from "./facility-access";

/**
 * Check if user has access to a facility route
 * Returns redirect response if access is denied, null if access is granted
 */
export async function checkFacilityRouteAccess(
  userId: string,
  facilityId: string,
  organizationId: string,
  userRole: string
): Promise<{ redirect: boolean; redirectTo?: string }> {
  const accessResult = await checkFacilityAccess(
    userId,
    facilityId,
    organizationId,
    userRole
  );

  if (!accessResult.hasAccess) {
    const locale = await getLocale();
    return {
      redirect: true,
      redirectTo: `/unauthorized`,
    };
  }

  return { redirect: false };
}

/**
 * Verify facility access and redirect if denied
 * Use this in page components that accept facilityId
 */
export async function verifyFacilityAccess(
  userId: string,
  facilityId: string,
  organizationId: string,
  userRole: string
): Promise<void> {
  const result = await checkFacilityRouteAccess(
    userId,
    facilityId,
    organizationId,
    userRole
  );

  if (result.redirect && result.redirectTo) {
    const locale = await getLocale();
    redirect({ href: result.redirectTo, locale });
  }
}

