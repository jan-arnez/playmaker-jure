import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { canPerformOwnerActions } from "@/lib/check-organization-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { categoryId } = await params;

    const sportCategory = await prisma.sportCategory.findUnique({
      where: { id: categoryId },
      include: {
        courts: {
          orderBy: { name: "asc" }
        },
        facility: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!sportCategory) {
      return NextResponse.json({ error: "Sport category not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can access sport categories.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      sportCategory.facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(sportCategory);
  } catch (error) {
    console.error("Error fetching sport category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { categoryId } = await params;
    const body = await request.json();
    const { name, description, type } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    // Get sport category and facility info
    const existingCategory = await prisma.sportCategory.findUnique({
      where: { id: categoryId },
      include: {
        facility: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Sport category not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can update sport categories.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      existingCategory.facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const sportCategory = await prisma.sportCategory.update({
      where: { id: categoryId },
      data: {
        name,
        description,
        type
      },
      include: {
        courts: {
          orderBy: { name: "asc" }
        }
      }
    });

    return NextResponse.json(sportCategory);
  } catch (error) {
    console.error("Error updating sport category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { categoryId } = await params;

    // Get sport category and facility info
    const existingCategory = await prisma.sportCategory.findUnique({
      where: { id: categoryId },
      include: {
        facility: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Sport category not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can delete sport categories.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      existingCategory.facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.sportCategory.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({ message: "Sport category deleted successfully" });
  } catch (error) {
    console.error("Error deleting sport category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
