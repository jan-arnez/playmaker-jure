import { prisma } from "@/lib/prisma";
import { Grid3X3, Building, MapPin, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourtsTable } from "@/modules/admin/components/courts/courts-table";

export default async function AdminCourtsPage() {
  // Get all courts with their facility (through sportCategory) and sport info
  const courts = await prisma.court.findMany({
    include: {
      sportCategory: {
        select: {
          id: true,
          name: true,
          facility: {
            select: {
              id: true,
              name: true,
              address: true,
              organization: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Get stats
  const totalCourts = courts.length;
  const totalFacilities = new Set(courts.map((c) => c.sportCategory.facility.id)).size;

  // Courts by sport
  const sportCounts = courts.reduce((acc, court) => {
    const sport = court.sportCategory?.name || "Unknown";
    acc[sport] = (acc[sport] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Courts by type (indoor/outdoor)
  const indoorCount = courts.filter((c) => c.locationType === "indoor").length;
  const outdoorCount = courts.filter((c) => c.locationType === "outdoor").length;

  return (
    <div className="container space-y-6">
      <div className="flex items-center gap-3">
        <Grid3X3 className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Courts Overview</h1>
          <p className="text-muted-foreground">
            Platform-wide view of all courts across facilities
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courts</CardTitle>
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facilities</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFacilities}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indoor</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indoorCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outdoor</CardTitle>
            <MapPin className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outdoorCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Courts by Sport */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Courts by Sport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(sportCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([sport, count]) => (
                <div
                  key={sport}
                  className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg"
                >
                  <span className="font-medium">{sport}</span>
                  <Badge>{count}</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Courts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Courts</CardTitle>
        </CardHeader>
        <CardContent>
          <CourtsTable courts={courts} />
        </CardContent>
      </Card>
    </div>
  );
}
