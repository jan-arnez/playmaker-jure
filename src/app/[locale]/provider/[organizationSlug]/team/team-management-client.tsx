"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TeamManagement } from "@/modules/provider/components/team/team-management";
import { InviteMemberDialog } from "./invite-member-dialog";
import { AssignFacilitiesDialog } from "./assign-facilities-dialog";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";  // Admin role does not exist in Member model
  joinedAt: string;
  facilities?: { id: string; name: string }[];
}

interface PendingInvitation {
  id: string;
  email: string;
  role: "owner" | "member";
  status: string;
  expiresAt: string;
  createdAt: string;
  inviterName: string;
}

interface Facility {
  id: string;
  name: string;
}

interface TeamManagementClientProps {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  userRole: string;
  members: TeamMember[];
  pendingInvitations?: PendingInvitation[];
  facilities: Facility[];
}

export function TeamManagementClient({
  organization,
  userRole,
  members: initialMembers,
  pendingInvitations: initialPendingInvitations = [],
  facilities,
}: TeamManagementClientProps) {
  const router = useRouter();
  const t = useTranslations("ProviderModule.team");
  const [members, setMembers] = useState(initialMembers);
  const [pendingInvitations, setPendingInvitations] = useState(initialPendingInvitations);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const handleInviteMember = () => {
    setIsInviteDialogOpen(true);
  };

  const handleInviteSuccess = (invitation?: PendingInvitation) => {
    if (invitation) {
      // Add to pending invitations list
      setPendingInvitations((prev) => [invitation, ...prev]);
      toast.success(t("toast.inviteSent"));
    } else {
      // Refresh to get latest data
      router.refresh();
      toast.success(t("toast.inviteSent"));
    }
  };

  const handleAssignFacilities = (member: TeamMember) => {
    setSelectedMember(member);
    setIsAssignDialogOpen(true);
  };

  const handleAssignSuccess = () => {
    setIsAssignDialogOpen(false);
    setSelectedMember(null);
    router.refresh();
    toast.success(t("toast.facilitiesAssigned"));
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    /*
     * SECURITY CRITICAL: Admin role assignment is FORBIDDEN
     * 
     * The admin role is EXTREMELY sensitive and can ONLY be assigned by the platform owner.
     * Organization owners (or any other user) MUST NEVER be able to assign admin roles.
     * 
     * This function should:
     * 1. Reject any attempt to set role to "admin"
     * 2. Only allow switching between "owner" and "member" roles
     * 3. Include server-side validation in the API endpoint
     */
    if (newRole === "admin") {
      toast.error(t("toast.adminRoleForbidden"));
      return;
    }

    try {
      // TODO: Implement API call to update member role
      // MUST include validation to prevent admin role assignment
      toast.info(t("toast.roleUpdateComingSoon"));
    } catch (error) {
      toast.error(t("toast.memberRemoveError"));
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setMemberToRemove(memberId);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      // TODO: Implement API call to remove member
      toast.info(t("toast.memberRemovalComingSoon"));
    } catch (error) {
      toast.error(t("toast.memberRemoveError"));
    } finally {
      setIsRemoveDialogOpen(false);
      setMemberToRemove(null);
    }
  };

  return (
    <>
      <TeamManagement
        _organization={organization}
        userRole={userRole}
        members={members}
        pendingInvitations={pendingInvitations}
        onInviteMember={handleInviteMember}
        onUpdateMemberRole={handleUpdateMemberRole}
        onRemoveMember={handleRemoveMember}
        onAssignFacilities={handleAssignFacilities}
      />

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        organizationId={organization.id}
        facilities={facilities}
        onSuccess={handleInviteSuccess}
      />

      {selectedMember && (
        <AssignFacilitiesDialog
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          organizationId={organization.id}
          memberId={selectedMember.id}
          memberName={selectedMember.name}
          currentFacilities={selectedMember.facilities || []}
          allFacilities={facilities}
          onSuccess={handleAssignSuccess}
        />
      )}

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.removeMember.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.removeMember.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dialogs.removeMember.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("dialogs.removeMember.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
