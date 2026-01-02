"use client";

import { Building2, ExternalLink, MoreVertical, Settings, Trash2, Users } from "lucide-react";
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
import { DialogProvider } from "@/context/dialog-context";
import { deleteOrganization } from "../../actions/delete-organization";
import InviteOwnerDialog from "../dialog/invite-owner-dialog";
import { ManageMembersDialog } from "../dialog/manage-members-dialog";
import { useRouter } from "@/i18n/navigation";

interface OrganizationTableActionsProps {
  organizationId: string;
  organizationName: string;
  organizationSlug?: string | null;
}

export function OrganizationTableActions({
  organizationId,
  organizationName,
  organizationSlug,
}: OrganizationTableActionsProps) {
  const t = useTranslations("AdminModule.organizationTableActions");
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);

  const handleDelete = async () => {
    await deleteOrganization(organizationId);
    setShowDeleteDialog(false);
  };

  // Navigate to owner dashboard for this organization
  // Admin has access to all organizations via the provider layout check
  const handleManageOrganization = () => {
    // Use organization slug (or ID as fallback) for the provider route
    const routeParam = organizationSlug || organizationId;
    router.push(`/provider/${routeParam}`);
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
        <DropdownMenuContent align="end" className="w-56">
          {/* Manage Organization - Primary Action */}
          <DropdownMenuItem 
            onClick={handleManageOrganization}
            className="font-medium"
          >
            <Settings className="mr-2 h-4 w-4" />
            Manage Organization
          </DropdownMenuItem>

          {/* Open in new tab */}
          <DropdownMenuItem asChild>
            <a
              href={`/provider/${organizationSlug || organizationId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DialogProvider>
            <InviteOwnerDialog organizationId={organizationId}>
              <Button
                variant="ghost"
                className="w-full items-start justify-start px-2 font-normal"
              >
                <Users className="mr-2 h-4 w-4" />
                {t("inviteOwner")}
              </Button>
            </InviteOwnerDialog>
          </DialogProvider>

          <DropdownMenuItem onClick={() => setShowManageMembers(true)}>
            <Users className="mr-2 h-4 w-4" />
            {t("manageMembers")}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogDescription>
              {t("confirmDeleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManageMembersDialog
        open={showManageMembers}
        onOpenChange={setShowManageMembers}
        organizationId={organizationId}
        organizationName={organizationName}
      />
    </>
  );
}
