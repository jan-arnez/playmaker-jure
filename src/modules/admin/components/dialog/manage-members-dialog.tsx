"use client";

import { AlertCircle, Loader2, Trash2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Member {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: string;
  createdAt: string;
}

interface ManageMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

export function ManageMembersDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: ManageMembersDialogProps) {
  const t = useTranslations("AdminModule.manageMembers");
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/members`,
      );
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
      } else {
        setError("Failed to fetch members");
      }
    } catch {
      setError("Failed to fetch members");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, fetchMembers]);

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;

    setIsAddingMember(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: newMemberEmail,
            role: newMemberRole,
          }),
        },
      );

      if (response.ok) {
        setNewMemberEmail("");
        setNewMemberRole("member");
        await fetchMembers();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to add member");
      }
    } catch {
      setError("Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/members/${memberId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        await fetchMembers();
      } else {
        setError("Failed to remove member");
      }
    } catch {
      setError("Failed to remove member");
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { organizationName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add New Member */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">{t("addMember")}</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                />
              </div>
              <div className="w-32">
                <Label htmlFor="role">{t("role")}</Label>
                <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">{t("roleMember")}</SelectItem>
                    <SelectItem value="admin">{t("roleAdmin")}</SelectItem>
                    <SelectItem value="owner">{t("roleOwner")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddMember}
                  disabled={isAddingMember || !newMemberEmail.trim()}
                >
                  {isAddingMember && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t("add")}
                </Button>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div>
            <h3 className="text-lg font-medium mb-4">{t("currentMembers")}</h3>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("role")}</TableHead>
                    <TableHead>{t("joinedAt")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.user.name}
                      </TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role === "owner"
                            ? t("roleOwner")
                            : member.role === "admin"
                              ? t("roleAdmin")
                              : t("roleMember")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={member.role === "owner"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
