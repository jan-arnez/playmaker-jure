import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; memberId: string }> },
) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { organizationId, memberId } = await params;

    // Check if member exists and get their role
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        organizationId: organizationId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent removing the last owner
    if (member.role === "owner") {
      const ownerCount = await prisma.member.count({
        where: {
          organizationId: organizationId,
          role: "owner",
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last owner" },
          { status: 400 },
        );
      }
    }

    // Remove member
    await prisma.member.delete({
      where: {
        id: memberId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
