"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Percent,
  Users,
  Target,
  TrendingUp,
  Edit,
  Eye,
  Trash2,
  Power,
  PowerOff,
  BarChart3,
  Search,
  MoreHorizontal,
  Copy,
  Calendar,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProviderDashboardLayout } from "../layout/provider-dashboard-layout";
import { FacilityPicker } from "../facility-picker";
import { CreatePromotionDialog } from "./create-promotion-dialog";
import { EditPromotionDialog } from "./edit-promotion-dialog";
import { ViewPromotionDialog } from "./view-promotion-dialog";
import { PromotionAnalytics } from "./promotion-analytics";
import { PromotionUsageCharts } from "./promotion-usage-charts";
import { toast } from "sonner";

interface PromotionsDashboardProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
  };
  userRole: string;
  facilities: Array<{
    id: string;
    name: string;
    description?: string;
    address: string;
    city: string;
    phone?: string;
    email?: string;
    createdAt: string;
    updatedAt: string;
    sportCategories: Array<{
      id: string;
      name: string;
      type: string;
      courts: Array<{ id: string; name: string }>;
    }>;
  }>;
}

interface Promotion {
  id: string;
  name: string;
  description?: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "expired";
  usageCount: number;
  maxUsage?: number | null;
  maxUsagePerUser?: number | null;
  facilities: string[];
  facilityNames?: string[];
  sportCategories?: string[];
  sportCategoryNames?: string[];
  courts?: string[];
  courtNames?: string[];
  createdAt: string;
  timeRestrictions?: {
    daysOfWeek?: number[];
    timeRange?: { start: string; end: string };
  } | null;
  usageByDay?: Record<string, number>;
}

export function PromotionsDashboard({
  organization,
  userRole,
  facilities,
}: PromotionsDashboardProps) {
  const t = useTranslations("ProviderModule.promotions");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [viewingPromotion, setViewingPromotion] = useState<any>(null);
  const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(null);
  const [loadingPromotionId, setLoadingPromotionId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Filter, search, and sort states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [extendingPromotion, setExtendingPromotion] = useState<Promotion | null>(null);
  const [extendDays, setExtendDays] = useState<string>("30");

  const canCreatePromotion = userRole === "owner" || userRole === "admin";
  const canManagePromotion = userRole === "owner" || userRole === "admin";

  useEffect(() => {
    fetchPromotions();
  }, [organization.id]);

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/promotions?organizationId=${organization.id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch promotions");
      }
      const data = await response.json();
      setPromotions(data);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      toast.error(t("toast.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchPromotions();
  };

  const handleEditSuccess = () => {
    fetchPromotions();
    setEditingPromotion(null);
  };

  const handleViewDetails = async (promotion: Promotion) => {
    try {
      const response = await fetch(`/api/promotions/${promotion.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch promotion details");
      }
      const data = await response.json();
      setViewingPromotion(data);
    } catch (error) {
      console.error("Error fetching promotion details:", error);
      toast.error("Failed to load promotion details");
    }
  };

  const handleToggleStatus = async (promotion: Promotion) => {
    if (!canManagePromotion) return;

    try {
      setLoadingPromotionId(promotion.id);
      const newStatus = promotion.status === "active" ? "inactive" : "active";
      const response = await fetch(`/api/promotions/${promotion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update promotion status");
      }

      toast.success(
        `Promotion ${newStatus === "active" ? "activated" : "deactivated"}`
      );
      fetchPromotions();
    } catch (error: any) {
      console.error("Error updating promotion status:", error);
      toast.error(error.message || "Failed to update promotion status");
    } finally {
      setLoadingPromotionId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingPromotion || !canManagePromotion) return;

    try {
      setLoadingPromotionId(deletingPromotion.id);
      const response = await fetch(`/api/promotions/${deletingPromotion.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete promotion");
      }

      const result = await response.json();
      if (result.deactivated) {
        toast.info("Promotion deactivated (cannot delete used promotions)");
      } else {
        toast.success("Promotion deleted successfully");
      }
      fetchPromotions();
      setDeletingPromotion(null);
    } catch (error: any) {
      console.error("Error deleting promotion:", error);
      toast.error(error.message || "Failed to delete promotion");
    } finally {
      setLoadingPromotionId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter, search, and sort promotions
  const filteredAndSortedPromotions = promotions
    .filter((promotion) => {
      // Status filter
      if (statusFilter !== "all" && promotion.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          promotion.name.toLowerCase().includes(query) ||
          (promotion.description || "").toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "usage-desc":
          return b.usageCount - a.usageCount;
        case "usage-asc":
          return a.usageCount - b.usageCount;
        case "discount-desc":
          return b.discountValue - a.discountValue;
        case "discount-asc":
          return a.discountValue - b.discountValue;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  const stats = {
    totalPromotions: promotions.length,
    activePromotions: promotions.filter((p) => p.status === "active").length,
    totalUsage: promotions.reduce((sum, p) => sum + p.usageCount, 0),
    totalSavings: promotions.reduce((sum, p) => {
      // Estimate savings based on usage
      const avgBookingPrice = 25; // Average booking price
      const savings =
        p.discountType === "percentage"
          ? (p.discountValue / 100) * avgBookingPrice * p.usageCount
          : p.discountValue * p.usageCount;
      return sum + savings;
    }, 0),
  };

  // Quick actions
  const handleDuplicate = async (promotion: Promotion) => {
    try {
      setLoadingPromotionId(promotion.id);
      const response = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${promotion.name} (Copy)`,
          description: promotion.description,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          status: "inactive",
          maxUsage: promotion.maxUsage,
          maxUsagePerUser: promotion.maxUsagePerUser,
          facilityIds: promotion.facilities,
          timeRestrictions: promotion.timeRestrictions,
          organizationId: organization.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate promotion");
      }

      toast.success("Promotion duplicated successfully");
      fetchPromotions();
    } catch (error: any) {
      console.error("Error duplicating promotion:", error);
      toast.error(error.message || "Failed to duplicate promotion");
    } finally {
      setLoadingPromotionId(null);
    }
  };

  const handleExtendDates = async () => {
    if (!extendingPromotion) return;

    try {
      setLoadingPromotionId(extendingPromotion.id);
      const days = Number(extendDays);
      const currentEndDate = new Date(extendingPromotion.endDate);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      const response = await fetch(`/api/promotions/${extendingPromotion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endDate: newEndDate.toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to extend promotion dates");
      }

      toast.success(`Promotion extended by ${days} days`);
      fetchPromotions();
      setExtendingPromotion(null);
      setExtendDays("30");
    } catch (error: any) {
      console.error("Error extending promotion:", error);
      toast.error(error.message || "Failed to extend promotion");
    } finally {
      setLoadingPromotionId(null);
    }
  };

  return (
    <ProviderDashboardLayout organization={organization} userRole={userRole}>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden max-w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              {t("subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <FacilityPicker
              facilities={facilities.map((facility) => ({
                id: facility.id,
                name: facility.name,
              }))}
              organizationId={organization.id}
            />
            <Button
              variant={showAnalytics ? "default" : "outline"}
              size="default"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="whitespace-nowrap"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{showAnalytics ? t("hideAnalytics") : t("viewAnalytics")}</span>
              <span className="sm:hidden">{showAnalytics ? "Hide" : "Analytics"}</span>
            </Button>
            {canCreatePromotion && (
              <Button size="default" onClick={() => setShowCreateDialog(true)} className="whitespace-nowrap">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("createPromotion")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Analytics View */}
        {showAnalytics ? (
          <PromotionAnalytics organizationId={organization.id} />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                {t("stats.totalPromotions")}
              </CardTitle>
              <Percent className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {isLoading ? "..." : stats.totalPromotions}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.activePromotions} {t("stats.active")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                {t("stats.totalUsage")}
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {isLoading ? "..." : stats.totalUsage}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t("stats.timesRedeemed")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                {t("stats.customerSavings")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {isLoading ? "..." : `€${stats.totalSavings.toFixed(0)}`}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t("stats.totalValueProvided")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                {t("stats.activePromotions")}
              </CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {isLoading ? "..." : stats.activePromotions}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t("stats.currentlyRunning")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter, Search, and Sort Controls */}
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {/* Search */}
              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label htmlFor="search" className="text-xs md:text-sm">{t("filters.search")}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder={t("filters.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="statusFilter" className="text-xs md:text-sm">{t("filters.status")}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="statusFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allStatus")}</SelectItem>
                    <SelectItem value="active">{t("filters.active")}</SelectItem>
                    <SelectItem value="inactive">{t("filters.inactive")}</SelectItem>
                    <SelectItem value="expired">{t("filters.expired")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <Label htmlFor="sortBy" className="text-xs md:text-sm">{t("filters.sortBy")}</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sortBy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">{t("filters.newestFirst")}</SelectItem>
                    <SelectItem value="date-asc">{t("filters.oldestFirst")}</SelectItem>
                    <SelectItem value="usage-desc">{t("filters.mostUsed")}</SelectItem>
                    <SelectItem value="usage-asc">{t("filters.leastUsed")}</SelectItem>
                    <SelectItem value="discount-desc">{t("filters.highestDiscount")}</SelectItem>
                    <SelectItem value="discount-asc">{t("filters.lowestDiscount")}</SelectItem>
                    <SelectItem value="name-asc">{t("filters.nameAZ")}</SelectItem>
                    <SelectItem value="name-desc">{t("filters.nameZA")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results Count - hidden on mobile, shown on tablet+ */}
              <div className="hidden md:block space-y-2">
                <Label className="text-xs md:text-sm">{t("filters.results")}</Label>
                <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                  <span className="text-sm text-gray-600">
                    {filteredAndSortedPromotions.length} / {promotions.length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promotions List */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">{t("list.allPromotions")}</h2>
            {(statusFilter !== "all" || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
              >
                <X className="h-4 w-4 mr-1" />
                {t("filters.clearFilters")}
              </Button>
            )}
          </div>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{t("loading")}</p>
            </div>
          ) : promotions.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Percent className="h-5 w-5" />
                  <span>{t("emptyState.title")}</span>
                </CardTitle>
                <CardDescription>
                  {t("emptyState.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <Percent className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("emptyState.boostTitle")}
                  </h3>
                  <p className="text-gray-500 mb-4 max-w-md mx-auto text-sm md:text-base">
                    {t("emptyState.boostDescription")}
                  </p>
                  {canCreatePromotion && (
                    <Button size="default" onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t("emptyState.createFirst")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:gap-4">
              {filteredAndSortedPromotions.map((promotion) => (
                <Card
                  key={promotion.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2 md:pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base md:text-lg truncate">{promotion.name}</CardTitle>
                        <CardDescription className="mt-1 text-xs md:text-sm line-clamp-2">
                          {promotion.description || t("list.noDescription")}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(promotion.status)}>
                        {promotion.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-600">{t("list.discount")}</p>
                        <p className="text-base md:text-lg font-semibold text-gray-900">
                          {promotion.discountType === "percentage"
                            ? `${promotion.discountValue}%`
                            : `€${promotion.discountValue}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-600">{t("list.usage")}</p>
                        <p className="text-base md:text-lg font-semibold text-gray-900">
                          {promotion.usageCount}
                          {promotion.maxUsage && ` / ${promotion.maxUsage}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-600">{t("list.validUntil")}</p>
                        <p className="text-base md:text-lg font-semibold text-gray-900">
                          {new Date(promotion.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-600">{t("list.facilities")}</p>
                        <p className="text-base md:text-lg font-semibold text-gray-900">
                          {promotion.facilities.length === 0
                            ? t("list.all")
                            : promotion.facilities.length}
                        </p>
                      </div>
                    </div>
                    {/* Desktop: inline buttons | Mobile: dropdown menu */}
                    <div className="mt-4 hidden md:flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(promotion)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t("actions.viewDetails")}
                      </Button>
                      {canManagePromotion && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPromotion(promotion)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {t("actions.edit")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicate(promotion)}
                            disabled={loadingPromotionId === promotion.id}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            {t("actions.duplicate")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExtendingPromotion(promotion)}
                            disabled={loadingPromotionId === promotion.id}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            {t("actions.extend")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(promotion)}
                            disabled={loadingPromotionId === promotion.id}
                          >
                            {promotion.status === "active" ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-1" />
                                {t("actions.deactivate")}
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-1" />
                                {t("actions.activate")}
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingPromotion(promotion)}
                            className="text-red-600 hover:text-red-700"
                            disabled={loadingPromotionId === promotion.id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {t("actions.delete")}
                          </Button>
                        </>
                      )}
                    </div>
                    {/* Mobile: dropdown menu */}
                    <div className="mt-3 flex md:hidden justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(promotion)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t("actions.viewDetails")}
                      </Button>
                      {canManagePromotion && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t("actions.moreActions")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingPromotion(promotion)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t("actions.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(promotion)}>
                              <Copy className="h-4 w-4 mr-2" />
                              {t("actions.duplicate")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setExtendingPromotion(promotion)}>
                              <Calendar className="h-4 w-4 mr-2" />
                              {t("actions.extend")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatus(promotion)}>
                              {promotion.status === "active" ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  {t("actions.deactivate")}
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  {t("actions.activate")}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeletingPromotion(promotion)}
                              className="text-red-600 focus:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("actions.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Usage Charts */}
        {filteredAndSortedPromotions.length > 0 && (
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">{t("usageAnalytics")}</h2>
            <PromotionUsageCharts promotions={filteredAndSortedPromotions} />
          </div>
        )}
          </>
        )}
      </div>

      {/* Create Dialog */}
      <CreatePromotionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        organizationId={organization.id}
        facilities={facilities.map((f) => ({
          id: f.id,
          name: f.name,
          sportCategories: f.sportCategories || [],
        }))}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Dialog */}
      {editingPromotion && (
        <EditPromotionDialog
          open={!!editingPromotion}
          onOpenChange={(open) => !open && setEditingPromotion(null)}
          promotion={editingPromotion}
          facilities={facilities.map((f) => ({
            id: f.id,
            name: f.name,
            sportCategories: f.sportCategories || [],
          }))}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* View Dialog */}
      {viewingPromotion && (
        <ViewPromotionDialog
          open={!!viewingPromotion}
          onOpenChange={(open) => !open && setViewingPromotion(null)}
          promotion={viewingPromotion}
          onEdit={() => {
            setViewingPromotion(null);
            // Transform viewing promotion to editing promotion format
            const editPromo = {
              ...viewingPromotion,
              facilities: Array.isArray(viewingPromotion.facilities)
                ? viewingPromotion.facilities.map((f: any) =>
                    typeof f === "string" ? f : f.id
                  )
                : [],
            };
            setEditingPromotion(editPromo as any);
          }}
        />
      )}

      {/* Extend Dates Dialog */}
      <Dialog
        open={!!extendingPromotion}
        onOpenChange={(open) => !open && setExtendingPromotion(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Promotion Dates</DialogTitle>
            <DialogDescription>
              Extend the end date for "{extendingPromotion?.name}". Current end date:{" "}
              {extendingPromotion
                ? new Date(extendingPromotion.endDate).toLocaleDateString()
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="extendDays">Extend by (days)</Label>
              <Input
                id="extendDays"
                type="number"
                min="1"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                placeholder="30"
              />
              {extendingPromotion && (
                <p className="text-xs text-gray-500">
                  New end date:{" "}
                  {new Date(
                    new Date(extendingPromotion.endDate).getTime() +
                      Number(extendDays) * 24 * 60 * 60 * 1000
                  ).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setExtendingPromotion(null);
                setExtendDays("30");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleExtendDates} disabled={!extendDays || Number(extendDays) < 1}>
              Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingPromotion}
        onOpenChange={(open) => !open && setDeletingPromotion(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promotion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingPromotion?.name}"? This
              action cannot be undone. If the promotion has been used, it will be
              deactivated instead of deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingPromotion(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProviderDashboardLayout>
  );
}
