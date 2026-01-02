import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { createRateLimit } from "@/lib/security";

const rateLimit = createRateLimit({ windowMs: 60 * 1000, maxRequests: 30 });

// GET: List all organizations with full details
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, any> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          _count: {
            select: {
              facilities: true,
              members: true,
            },
          },
          members: {
            where: { role: "owner" },
            select: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.organization.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: organizations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + organizations.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

// PATCH: Update organization
export async function PATCH(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, action, ...data } = body;

    if (!organizationId || !action) {
      return NextResponse.json(
        { error: "organizationId and action are required" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "updateInfo":
        result = await prisma.organization.update({
          where: { id: organizationId },
          data: {
            name: data.name,
            slug: data.slug,
          },
        });
        break;

      case "transferOwnership":
        // Remove current owner role
        await prisma.member.updateMany({
          where: { organizationId, role: "owner" },
          data: { role: "member" },
        });
        // Set new owner
        await prisma.member.update({
          where: { id: data.newOwnerMemberId },
          data: { role: "owner" },
        });
        result = { success: true };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // TODO: Log to audit log (Phase 4)

    return NextResponse.json({
      success: true,
      data: result,
      message: `Organization ${action} successful`,
    });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}
