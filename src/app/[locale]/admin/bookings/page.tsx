import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { BookingsDataTable } from "@/modules/admin/components/data-table/bookings-data-table";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      price: true,
      paymentStatus: true,
      isSeasonal: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      facility: {
        select: {
          id: true,
          name: true,
        },
      },
      court: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { startTime: "desc" },
    take: 100, // Limit initial load
  });

  // Calculate stats
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;

  const stats = [
    { label: "Total Bookings", value: totalBookings, icon: Calendar },
    { label: "Confirmed", value: confirmedBookings, icon: CheckCircle },
    { label: "Pending", value: pendingBookings, icon: Clock },
    { label: "Cancelled", value: cancelledBookings, icon: XCircle },
  ];

  return (
    <div className="container space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">
          Manage all bookings across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BookingsDataTable data={bookings.map(b => ({
        ...b,
        isSeasonal: b.isSeasonal ?? false
      }))} />
    </div>
  );
}
