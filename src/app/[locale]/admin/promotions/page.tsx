import { prisma } from "@/lib/prisma";
import { Tag, CheckCircle, Clock, XCircle, Percent, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function AdminPromotionsPage() {
  // Fetch all promotions with organization info
  const promotions = await prisma.promotion.findMany({
    include: {
      organization: {
        select: { name: true, slug: true },
      },
      creator: {
        select: { name: true, email: true },
      },
      facilities: {
        select: { name: true },
      },
      _count: {
        select: { usageRecords: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate stats
  const totalPromotions = promotions.length;
  const activePromotions = promotions.filter(p => p.status === "active").length;
  const expiredPromotions = promotions.filter(p => new Date(p.endDate) < new Date()).length;
  const totalUsage = promotions.reduce((sum, p) => sum + p._count.usageRecords, 0);

  const getStatusBadge = (promo: typeof promotions[0]) => {
    const now = new Date();
    if (promo.status === "inactive") {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (new Date(promo.endDate) < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (new Date(promo.startDate) > now) {
      return <Badge variant="outline">Scheduled</Badge>;
    }
    return <Badge className="bg-green-600">Active</Badge>;
  };

  return (
    <div className="container space-y-6">
      <div className="flex items-center gap-3">
        <Tag className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Promotions</h1>
          <p className="text-muted-foreground">
            View and manage promotions across all organizations
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Promotions</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPromotions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePromotions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredPromotions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
          </CardContent>
        </Card>
      </div>

      {/* Promotions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Promotions</CardTitle>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No promotions found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Organization</th>
                    <th className="text-left py-3 px-4 font-medium">Discount</th>
                    <th className="text-left py-3 px-4 font-medium">Period</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Usage</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((promo) => (
                    <tr key={promo.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{promo.name}</div>
                        {promo.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {promo.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">{promo.organization.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {promo.discountType === "percentage" ? (
                            <>
                              <Percent className="h-4 w-4" />
                              {Number(promo.discountValue)}%
                            </>
                          ) : (
                            <>€{Number(promo.discountValue)}</>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs">
                          {format(new Date(promo.startDate), "MMM d")} - {format(new Date(promo.endDate), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(promo)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {promo._count.usageRecords}
                          {promo.maxUsage && (
                            <span className="text-muted-foreground">/ {promo.maxUsage}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
