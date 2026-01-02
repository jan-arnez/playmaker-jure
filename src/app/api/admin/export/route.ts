import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";

// GET: Export data as CSV
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "users";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let data: string[][] = [];
    let filename = "";

    const dateFilter = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) }),
    };

    switch (type) {
      case "users":
        const users = await prisma.user.findMany({
          where: dateFrom || dateTo ? { createdAt: dateFilter } : undefined,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            trustLevel: true,
            activeStrikes: true,
            banned: true,
            emailVerified: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });
        
        data = [
          ["ID", "Name", "Email", "Role", "Trust Level", "Strikes", "Banned", "Email Verified", "Created At"],
          ...users.map((u) => [
            u.id,
            u.name,
            u.email,
            u.role || "user",
            String(u.trustLevel),
            String(u.activeStrikes),
            u.banned ? "Yes" : "No",
            u.emailVerified ? "Yes" : "No",
            u.createdAt.toISOString(),
          ]),
        ];
        filename = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case "bookings":
        const bookings = await prisma.booking.findMany({
          where: dateFrom || dateTo ? { createdAt: dateFilter } : undefined,
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            paymentStatus: true,
            price: true,
            isSeasonal: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
            facility: { select: { name: true } },
            court: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        
        data = [
          ["ID", "User Name", "User Email", "Facility", "Court", "Start Time", "End Time", "Status", "Payment", "Price", "Seasonal", "Created At"],
          ...bookings.map((b) => [
            b.id,
            b.user.name,
            b.user.email,
            b.facility.name,
            b.court?.name || "N/A",
            b.startTime.toISOString(),
            b.endTime.toISOString(),
            b.status,
            b.paymentStatus || "N/A",
            b.price ? String(b.price) : "0",
            b.isSeasonal ? "Yes" : "No",
            b.createdAt.toISOString(),
          ]),
        ];
        filename = `bookings-export-${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case "facilities":
        const facilities = await prisma.facility.findMany({
          where: dateFrom || dateTo ? { createdAt: dateFilter } : undefined,
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            status: true,
            createdAt: true,
            organization: { select: { name: true } },
            _count: { select: { bookings: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        
        data = [
          ["ID", "Name", "Organization", "City", "Address", "Status", "Total Bookings", "Created At"],
          ...facilities.map((f) => [
            f.id,
            f.name,
            f.organization.name,
            f.city,
            f.address,
            f.status,
            String(f._count.bookings),
            f.createdAt.toISOString(),
          ]),
        ];
        filename = `facilities-export-${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case "organizations":
        const organizations = await prisma.organization.findMany({
          where: dateFrom || dateTo ? { createdAt: dateFilter } : undefined,
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            _count: { select: { facilities: true, members: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        
        data = [
          ["ID", "Name", "Slug", "Facilities", "Members", "Created At"],
          ...organizations.map((o) => [
            o.id,
            o.name,
            o.slug || "",
            String(o._count.facilities),
            String(o._count.members),
            o.createdAt.toISOString(),
          ]),
        ];
        filename = `organizations-export-${new Date().toISOString().split("T")[0]}.csv`;
        break;

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    // Convert to CSV string
    const csv = data.map((row) => 
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
