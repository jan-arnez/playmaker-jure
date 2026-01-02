import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
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
    const { organizationId } = await params;

    const members = await prisma.member.findMany({
      where: {
        organizationId: organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /*
   * SECURITY CRITICAL: Only platform admins can access this endpoint
   * 
   * This endpoint is for platform admins (the platform owner) to manage organization members.
   * Organization owners CANNOT use this endpoint - they must use the provider team management.
   * 
   * The admin role in the User model (session.user.role) is different from the admin role
   * in the Member model (member.role). This endpoint checks for platform admin (User.role === "admin").
   */
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { organizationId } = await params;
    const { email, role } = await request.json();

    /*
     * SECURITY NOTE: Even platform admins should be careful when assigning roles.
     * The "admin" role in Member model should be used sparingly and only for
     * trusted platform administrators, not organization members.
     */

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 },
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create user if they don't exist
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          name: email.split("@")[0], // Use email prefix as name
          email,
          emailVerified: false,
        },
      });
    }

    // Check if user is already a member
    const existingMember = await prisma.member.findFirst({
      where: {
        userId: user.id,
        organizationId: organizationId,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 400 },
      );
    }

    // Add user to organization
    const member = await prisma.member.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        organizationId: organizationId,
        role,
        createdAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
