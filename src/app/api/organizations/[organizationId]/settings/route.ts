import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { canPerformOwnerActions, checkOrganizationAccess } from "@/lib/check-organization-access";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;
    const body = await request.json();
    const { rainSlotsEnabled } = body;

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can update organization settings.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 403 }
      );
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Update organization settings
    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        rainSlotsEnabled: rainSlotsEnabled !== undefined ? rainSlotsEnabled : undefined,
      },
    });

    return NextResponse.json({
      message: "Settings updated successfully",
      organization: {
        id: updated.id,
        rainSlotsEnabled: updated.rainSlotsEnabled,
      },
    });
  } catch (error) {
    console.error("Organization settings update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;

    // Check if user has access to this organization
    const accessResult = await checkOrganizationAccess(
      session.user.id,
      organizationId,
      session.user.role
    );

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 403 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        rainSlotsEnabled: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organization: {
        id: organization.id,
        rainSlotsEnabled: organization.rainSlotsEnabled ?? true,
      },
    });
  } catch (error) {
    console.error("Organization settings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

