import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ facilityId: string }>;
}

// GET /api/favorites/[facilityId] - Check if facility is favorited
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ isFavorite: false });
    }

    const { facilityId } = await params;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_facilityId: {
          userId: session.user.id,
          facilityId,
        },
      },
    });

    return NextResponse.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error("Error checking favorite:", error);
    return NextResponse.json({ isFavorite: false });
  }
}

// DELETE /api/favorites/[facilityId] - Remove from favorites
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { facilityId } = await params;

    // Try to delete the favorite
    await prisma.favorite.delete({
      where: {
        userId_facilityId: {
          userId: session.user.id,
          facilityId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // If not found, that's fine - already removed
    if (error?.code === "P2025") {
      return NextResponse.json({ success: true });
    }
    
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
