"use client";

import { Calendar, Mail, UserPlus, Users } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  lastActive?: string;
}

interface TeamManagementProps {
  _organization: {
    id: string;
    name: string;
    slug: string;
  };
  userRole: string;
  members: TeamMember[];
  onInviteMember?: () => void;
  onUpdateMemberRole?: (memberId: string, role: string) => void;
  onRemoveMember?: (memberId: string) => void;
}

export function TeamManagement({
  _organization,
  userRole,
  members = [],
  onInviteMember,
  onUpdateMemberRole,
  onRemoveMember,
}: TeamManagementProps) {
  const t = useTranslations("ProviderModule.team");

  const canManageTeam = userRole === "owner" || userRole === "admin";

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {t("role.owner")}
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {t("role.admin")}
          </Badge>
        );
      case "member":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            {t("role.member")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate stats
  const stats = {
    total: members.length,
    owners: members.filter((m) => m.role === "owner").length,
    admins: members.filter((m) => m.role === "admin").length,
    members: members.filter((m) => m.role === "member").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("team")}</h1>
          <p className="text-gray-600 mt-1">{t("manageTeamMembers")}</p>
        </div>
        {canManageTeam && onInviteMember && (
          <Button onClick={onInviteMember} size="lg">
            <UserPlus className="h-4 w-4 mr-2" />
            {t("inviteMember")}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("totalMembers")}
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("teamMembers")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("owners")}
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.owners}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t("organizationOwners")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("admins")}
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.admins}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("administrators")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("members")}
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.members}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("regularMembers")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("teamMembers")}</CardTitle>
          <CardDescription>{t("teamMembersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("memberRole")}</TableHead>
                    <TableHead>{t("joinedAt")}</TableHead>
                    <TableHead>{t("lastActive")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {member.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{member.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(member.joinedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {member.lastActive
                            ? formatDate(member.lastActive)
                            : t("never")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {canManageTeam &&
                            member.role !== "owner" &&
                            onUpdateMemberRole && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newRole =
                                    member.role === "admin"
                                      ? "member"
                                      : "admin";
                                  onUpdateMemberRole(member.id, newRole);
                                }}
                              >
                                {member.role === "admin"
                                  ? t("demote")
                                  : t("promote")}
                              </Button>
                            )}
                          {canManageTeam &&
                            member.role !== "owner" &&
                            onRemoveMember && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveMember(member.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                {t("remove")}
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("noMembers")}
              </h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                {t("noMembersDescription")}
              </p>
              {canManageTeam && onInviteMember && (
                <Button onClick={onInviteMember}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t("inviteFirstMember")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
