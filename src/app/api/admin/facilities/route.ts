import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { createRateLimit } from "@/lib/security";

const rateLimit = createRateLimit({ windowMs: 60 * 1000, maxRequests: 30 });

// GET: List all facilities with filters
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
    const status = searchParams.get("status");
    const organizationId = searchParams.get("organizationId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, any> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    const [facilities, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          address: true,
          status: true,
          images: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              sportCategories: true,
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.facility.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: facilities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + facilities.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching facilities:", error);
    return NextResponse.json(
      { error: "Failed to fetch facilities" },
      { status: 500 }
    );
  }
}

// PATCH: Update facility status
export async function PATCH(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { facilityId, action, ...data } = body;

    if (!facilityId || !action) {
      return NextResponse.json(
        { error: "facilityId and action are required" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "updateStatus":
        result = await prisma.facility.update({
          where: { id: facilityId },
          data: { status: data.status },
        });
        break;

      case "approve":
        result = await prisma.facility.update({
          where: { id: facilityId },
          data: { status: "active" },
        });
        break;

      case "suspend":
        result = await prisma.facility.update({
          where: { id: facilityId },
          data: { status: "maintenance" },
        });
        break;

      case "deactivate":
        result = await prisma.facility.update({
          where: { id: facilityId },
          data: { status: "inactive" },
        });
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
      message: `Facility ${action} successful`,
    });
  } catch (error) {
    console.error("Error updating facility:", error);
    return NextResponse.json(
      { error: "Failed to update facility" },
      { status: 500 }
    );
  }
}
