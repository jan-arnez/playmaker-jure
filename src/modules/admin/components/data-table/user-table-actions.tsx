"use client";

import {
  Ban,
  Eye,
  MoreVertical,
  RotateCcw,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/modules/auth/lib/auth-client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  activeStrikes?: number;
}

interface UserTableActionsProps {
  userId: string;
  user: User;
}

export function UserTableActions({ userId, user }: UserTableActionsProps) {
  const router = useRouter();
  const t = useTranslations("AdminModule.userTableActions");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("7"); // days
  const [loading, setLoading] = useState(false);

  const handleSetRole = async (role: "user" | "admin") => {
    try {
      await authClient.admin.setRole({
        userId,
        role,
        fetchOptions: {
          onSuccess: () => {
            toast.success(`User role updated to ${role}`);
            router.refresh();
          },
        },
      });
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const handleBanUser = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "ban",
          banReason,
          banDuration: parseInt(banDuration),
        }),
      });

      if (!res.ok) throw new Error("Failed to ban user");

      toast.success("User banned successfully");
      setBanDialogOpen(false);
      setBanReason("");
      router.refresh();
    } catch (error) {
      toast.error("Failed to ban user");
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "unban",
        }),
      });

      if (!res.ok) throw new Error("Failed to unban user");

      toast.success("User unbanned successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to unban user");
    } finally {
      setLoading(false);
    }
  };

  const handleResetStrikes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "resetStrikes",
        }),
      });

      if (!res.ok) throw new Error("Failed to reset strikes");

      toast.success("User strikes reset successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to reset strikes");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");

      toast.success("User deactivated successfully");
      setDeleteDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    router.push(`/admin/users/${userId}`);
  };



  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <MoreVertical className="size-4" />
            <span className="sr-only">{t("openMenu")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* View Details */}
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Reset Strikes */}
          {(user.activeStrikes ?? 0) > 0 && (
            <DropdownMenuItem onClick={handleResetStrikes} disabled={loading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Strikes
            </DropdownMenuItem>
          )}

          {/* Ban Management */}
          {!user.banned ? (
            <DropdownMenuItem onClick={() => setBanDialogOpen(true)}>
              <Ban className="h-4 w-4 mr-2" />
              Ban User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleUnbanUser} disabled={loading}>
              <UserCheck className="h-4 w-4 mr-2" />
              Unban User
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Delete User */}
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Ban {user.name} from the platform. They will not be able to access
              their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banReason">Reason for ban</Label>
              <Textarea
                id="banReason"
                placeholder="Enter reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banDuration">Ban duration (days, 0 = permanent)</Label>
              <Input
                id="banDuration"
                type="number"
                min="0"
                max="365"
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={!banReason.trim() || loading}
            >
              {loading ? "Banning..." : "Ban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {user.name}? This will ban the
              user permanently. This action can be reversed by unbanning.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={loading}
            >
              {loading ? "Deactivating..." : "Deactivate User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
