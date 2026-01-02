import { DialogProvider } from "@/context/dialog-context";
import { prisma } from "@/lib/prisma";
import { OrganizationsDataTable } from "@/modules/admin/components/data-table/organizations-data-table";
import { CreateOrganizationDialog } from "@/modules/admin/components/dialog/create-organization-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, MapPin, UserCheck } from "lucide-react";

export default async function OrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      facilities: {
        select: { id: true },
      },
      members: {
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform data for the table
  const organizationsData = organizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    createdAt: org.createdAt,
    facilitiesCount: org.facilities.length,
    membersCount: org.members.length,
    owner: org.members.find((m) => m.role === "owner")?.user || null,
  }));

  // Calculate stats
  const totalOrganizations = organizations.length;
  const totalFacilities = organizations.reduce((sum, org) => sum + org.facilities.length, 0);
  const totalMembers = organizations.reduce((sum, org) => sum + org.members.length, 0);
  const orgsWithOwners = organizations.filter((org) =>
    org.members.some((m) => m.role === "owner")
  ).length;

  const stats = [
    { label: "Organizations", value: totalOrganizations, icon: Building },
    { label: "Total Facilities", value: totalFacilities, icon: MapPin },
    { label: "Total Members", value: totalMembers, icon: Users },
    { label: "With Owners", value: orgsWithOwners, icon: UserCheck },
  ];

  return (
    <div className="container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage organizations, owners, and facilities
          </p>
        </div>
        <DialogProvider>
          <CreateOrganizationDialog />
        </DialogProvider>
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

      <OrganizationsDataTable data={organizationsData} />
    </div>
  );
}
