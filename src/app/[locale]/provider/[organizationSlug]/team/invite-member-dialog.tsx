"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { authClient } from "@/modules/auth/lib/auth-client";

/*
 * SECURITY CRITICAL: Admin role assignment is FORBIDDEN
 * 
 * This form schema intentionally excludes "admin" from the role enum.
 * The admin role is EXTREMELY sensitive and can ONLY be assigned by the platform owner.
 * Organization owners MUST NEVER be able to assign admin roles.
 * 
 * Allowed roles:
 * - "owner": Full access to organization and all facilities
 * - "member": Limited access to assigned facilities only (receptor)
 */
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "member"]), // Admin role is intentionally excluded
  facilityIds: z.array(z.string()).optional(),
});

interface Facility {
  id: string;
  name: string;
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

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  facilities: Facility[];
  onSuccess: (invitation?: PendingInvitation) => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  organizationId,
  facilities,
  onSuccess,
}: InviteMemberDialogProps) {
  const t = useTranslations("ProviderModule.team");
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "member",
      facilityIds: [],
    },
  });

  const selectedRole = form.watch("role");

  // Auto-select facility if only one exists and role is member
  const handleRoleChange = (role: string) => {
    form.setValue("role", role as "owner" | "member");
    if (role === "member" && facilities.length === 1) {
      setSelectedFacilityIds([facilities[0].id]);
    } else if (role !== "member") {
      setSelectedFacilityIds([]);
    }
  };

  const handleToggleFacility = (facilityId: string) => {
    setSelectedFacilityIds((prev) =>
      prev.includes(facilityId)
        ? prev.filter((id) => id !== facilityId)
        : [...prev, facilityId]
    );
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    /*
     * SECURITY CHECK: Ensure admin role is never sent
     * Even though the form schema prevents it, we add an extra check here
     */
    if (values.role === "admin") {
      toast.error("Admin role cannot be assigned. Only platform owner can assign admin roles.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // First, invite the member
      // Note: authClient.organization.inviteMember should also validate on the server side
      // that admin role cannot be assigned by organization owners
      const { error: inviteError } = await authClient.organization.inviteMember({
        organizationId,
        email: values.email,
        role: values.role, // This will be either "owner" or "member", never "admin"
      });

      if (inviteError) {
        throw new Error(inviteError.message);
      }

      // Show success message with invitation status
      const successMessage =
        values.role === "member" && selectedFacilityIds.length > 0
          ? t("toast.inviteSentWithFacilities")
          : t("toast.inviteSent");

      toast.success(successMessage, {
        duration: 5000,
      });

      // Create invitation object for callback (if API returns it)
      // For now, we'll pass basic info - will be replaced with real data on refresh
      const invitation: PendingInvitation = {
        id: `temp-${Date.now()}`, // Temporary ID, will be replaced on refresh
        email: values.email,
        role: values.role,
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        createdAt: new Date().toISOString(),
        inviterName: "You", // Will be replaced on refresh
      };

      form.reset();
      setSelectedFacilityIds([]);
      
      // Call onSuccess with invitation data
      onSuccess(invitation);
      
      // Close dialog after showing success
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error("Error inviting member:", error);
      toast.error(
        error instanceof Error ? error.message : t("toast.inviteError")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("dialogs.inviteMember.title")}</DialogTitle>
          <DialogDescription>
            {t("dialogs.inviteMember.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dialogs.inviteMember.emailLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("dialogs.inviteMember.emailPlaceholder")}
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dialogs.inviteMember.roleLabel")}</FormLabel>
                  <Select
                    onValueChange={handleRoleChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("dialogs.inviteMember.rolePlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="owner">{t("dialogs.inviteMember.roleOwner")}</SelectItem>
                      <SelectItem value="member">{t("dialogs.inviteMember.roleMember")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRole === "member" && facilities.length > 0 && (
              <div className="space-y-2">
                <Label>{t("dialogs.inviteMember.assignFacilities")}</Label>
                {facilities.length === 1 ? (
                  <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
                    {t("dialogs.inviteMember.oneFacilityNote")}
                  </div>
                ) : (
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    <div className="space-y-2">
                      {facilities.map((facility) => (
                        <div
                          key={facility.id}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50"
                        >
                          <Checkbox
                            id={facility.id}
                            checked={selectedFacilityIds.includes(facility.id)}
                            onCheckedChange={() =>
                              handleToggleFacility(facility.id)
                            }
                          />
                          <Label
                            htmlFor={facility.id}
                            className="flex-1 cursor-pointer text-sm font-normal"
                          >
                            {facility.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t("dialogs.inviteMember.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("dialogs.inviteMember.inviting") : t("dialogs.inviteMember.invite")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

