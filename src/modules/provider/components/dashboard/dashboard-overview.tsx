"use client";

import { Building2, Calendar, Plus, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProviderContext } from "@/context/provider-context";

interface DashboardOverviewProps {
  stats?: {
    totalFacilities: number;
    totalBookings: number;
    activeBookings: number;
    teamMembers: number;
    monthlyRevenue: number;
    pendingBookings: number;
  };
  onCreateFacility?: () => void;
}

export function DashboardOverview({
  stats = {
    totalFacilities: 0,
    totalBookings: 0,
    activeBookings: 0,
    teamMembers: 1,
    monthlyRevenue: 0,
    pendingBookings: 0,
  },
  onCreateFacility,
}: DashboardOverviewProps) {
  const t = useTranslations("ProviderModule.dashboard");
  const { organization, userRole } = useProviderContext();

  const canCreateFacility = userRole === "owner" || userRole === "admin";

  const statCards = [
    {
      title: t("totalFacilities"),
      value: stats.totalFacilities,
      description: t("facilitiesCreated"),
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: t("totalBookings"),
      value: stats.totalBookings,
      description: t("allTimeBookings"),
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: t("activeBookings"),
      value: stats.activeBookings,
      description: t("currentlyActive"),
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: t("monthlyRevenue"),
      value: `€${stats.monthlyRevenue}`,
      description: t("thisMonth"),
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("welcomeBack")}, {organization.name}
          </h1>
          <p className="text-gray-600 mt-1">{t("dashboardSubtitle")}</p>
        </div>
        {canCreateFacility && onCreateFacility && (
          <Button onClick={onCreateFacility} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            {t("createFacility")}
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t("recentActivity")}</CardTitle>
            <CardDescription>{t("recentActivityDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.pendingBookings > 0 ? (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t("pendingBookings")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.pendingBookings} {t("bookingsNeedAttention")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    {stats.pendingBookings}
                  </Badge>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">{t("noRecentActivity")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>{t("quickStats")}</CardTitle>
            <CardDescription>{t("quickStatsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t("teamMembers")}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.teamMembers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t("facilitiesCreated")}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalFacilities}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t("totalBookings")}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalBookings}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t("monthlyRevenue")}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  €{stats.monthlyRevenue}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      {stats.totalFacilities === 0 && canCreateFacility && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>{t("getStarted")}</span>
            </CardTitle>
            <CardDescription>{t("getStartedDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("createYourFirstFacility")}
              </h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                {t("createFirstFacilityDescription")}
              </p>
              {onCreateFacility && (
                <Button onClick={onCreateFacility} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("createFirstFacility")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
