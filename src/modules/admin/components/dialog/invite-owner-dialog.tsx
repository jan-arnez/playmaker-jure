import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDialog } from "@/context/dialog-context";
import { InviteOrganizationOwnerForm } from "../form/invite-organization-owner-form";

interface InviteOwnerDialogProps {
  organizationId: string;
  children: ReactNode;
}

export default function InviteOwnerDialog({
  organizationId,
  children,
}: InviteOwnerDialogProps) {
  const { isDialogOpen, setIsDialogOpen } = useDialog();

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => setIsDialogOpen(open)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-sm">
        <DialogHeader>
          <DialogTitle>Invite Organization Owner</DialogTitle>
        </DialogHeader>
        <InviteOrganizationOwnerForm organizationId={organizationId} />
      </DialogContent>
    </Dialog>
  );
}
