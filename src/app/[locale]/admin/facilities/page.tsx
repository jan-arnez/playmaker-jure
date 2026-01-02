import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { FacilitiesDataTable } from "@/modules/admin/components/data-table/facilities-data-table";

export default async function AdminFacilitiesPage() {
  const facilities = await prisma.facility.findMany({
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
  });

  // Calculate stats
  const totalFacilities = facilities.length;
  const activeFacilities = facilities.filter((f) => f.status === "active").length;
  const maintenanceFacilities = facilities.filter((f) => f.status === "maintenance").length;
  const inactiveFacilities = facilities.filter((f) => f.status === "inactive").length;

  const stats = [
    { label: "Total Facilities", value: totalFacilities, icon: MapPin },
    { label: "Active", value: activeFacilities, icon: CheckCircle },
    { label: "Maintenance", value: maintenanceFacilities, icon: AlertTriangle },
    { label: "Inactive", value: inactiveFacilities, icon: XCircle },
  ];

  return (
    <div className="container space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Facilities</h1>
        <p className="text-muted-foreground">
          Manage all facilities across the platform
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

      <FacilitiesDataTable data={facilities.map(f => ({
        ...f,
        slug: f.slug ?? "",
        organization: {
          ...f.organization,
          slug: f.organization.slug ?? ""
        }
      }))} />
    </div>
  );
}
