"use client";

import {
  Ban,
  MoreVertical,
  Shield,
  ShieldOff,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { logger } from "@/lib/logger";
import { authClient } from "@/modules/auth/lib/auth-client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
}

interface UserTableActionsProps {
  userId: string;
  user: User;
}

export function UserTableActions({ userId, user }: UserTableActionsProps) {
  const router = useRouter();
  const t = useTranslations("AdminModule.userTableActions");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("7"); // days

  const handleSetRole = async (role: "user" | "admin") => {
    try {
      await authClient.admin.setRole({
        userId,
        role,
        fetchOptions: {
          onSuccess: () => {
            logger.logUserAction("admin_set_role", { userId, role });
            router.refresh();
          },
        },
      });
    } catch (error) {
      logger.logError(error as Error, { action: "set_role", userId, role });
    }
  };

  const handleBanUser = async () => {
    try {
      const banExpires = new Date();
      // biome-ignore lint/correctness/useParseIntRadix: <>
      banExpires.setDate(banExpires.getDate() + parseInt(banDuration));

      // In a real app, you would call an API to ban the user
      logger.logUserAction("admin_ban_user", {
        userId,
        reason: banReason,
        duration: banDuration,
        expires: banExpires.toISOString(),
      });

      setBanDialogOpen(false);
      setBanReason("");
      router.refresh();
    } catch (error) {
      logger.logError(error as Error, { action: "ban_user", userId });
    }
  };

  const handleUnbanUser = async () => {
    try {
      // In a real app, you would call an API to unban the user
      logger.logUserAction("admin_unban_user", { userId });
      router.refresh();
    } catch (error) {
      logger.logError(error as Error, { action: "unban_user", userId });
    }
  };

  const handleDeleteUser = async () => {
    try {
      await authClient.admin.removeUser({
        userId,
        fetchOptions: {
          onSuccess: () => {
            logger.logUserAction("admin_delete_user", { userId });
            router.refresh();
          },
        },
      });
    } catch (error) {
      logger.logError(error as Error, { action: "delete_user", userId });
    }
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
          {/* Role Management */}
          {user.role !== "admin" && (
            <DropdownMenuItem onClick={() => handleSetRole("admin")}>
              <Shield className="h-4 w-4 mr-2" />
              {t("setAdmin")}
            </DropdownMenuItem>
          )}

          {user.role === "admin" && (
            <DropdownMenuItem onClick={() => handleSetRole("user")}>
              <ShieldOff className="h-4 w-4 mr-2" />
              Remove Admin
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Ban Management */}
          {!user.banned ? (
            <DropdownMenuItem onClick={() => setBanDialogOpen(true)}>
              <Ban className="h-4 w-4 mr-2" />
              Ban User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleUnbanUser}>
              <UserCheck className="h-4 w-4 mr-2" />
              Unban User
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Delete User */}
          <DropdownMenuItem
            onClick={handleDeleteUser}
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
              <Label htmlFor="banDuration">Ban duration (days)</Label>
              <Input
                id="banDuration"
                type="number"
                min="1"
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
              disabled={!banReason.trim()}
            >
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
