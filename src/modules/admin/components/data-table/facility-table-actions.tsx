"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle,
  Eye,
  ExternalLink,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/navigation";

interface Facility {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

interface FacilityTableActionsProps {
  facility: Facility;
}

export function FacilityTableActions({ facility }: FacilityTableActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (action: "approve" | "suspend" | "deactivate") => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/facilities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId: facility.id,
          action,
        }),
      });

      if (!res.ok) throw new Error("Failed to update facility");

      const actionLabels = {
        approve: "activated",
        suspend: "put in maintenance",
        deactivate: "deactivated",
      };

      toast.success(`Facility ${actionLabels[action]}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update facility status");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    router.push(`/admin/facilities/${facility.id}`);
  };

  const handleViewProviderDashboard = () => {
    // Navigate to provider dashboard for this organization
    window.open(`/provider/${facility.organization.slug}`, "_blank");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
          size="icon"
          disabled={loading}
        >
          <MoreVertical className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* View Details */}
        <DropdownMenuItem onClick={handleViewDetails}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>

        {/* View Provider Dashboard */}
        <DropdownMenuItem onClick={handleViewProviderDashboard}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Provider Dashboard
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Status Management */}
        {facility.status !== "active" && (
          <DropdownMenuItem onClick={() => handleStatusChange("approve")}>
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Activate
          </DropdownMenuItem>
        )}

        {facility.status !== "maintenance" && (
          <DropdownMenuItem onClick={() => handleStatusChange("suspend")}>
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
            Set Maintenance
          </DropdownMenuItem>
        )}

        {facility.status !== "inactive" && (
          <DropdownMenuItem
            onClick={() => handleStatusChange("deactivate")}
            className="text-red-600 focus:text-red-600"
          >
            <Ban className="h-4 w-4 mr-2" />
            Deactivate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
