"use client";

import { Calendar, Mail, UserPlus, Users, Building2, Clock, XCircle } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";
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
import { Skeleton } from "@/components/ui/skeleton";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";  // Admin role does not exist in Member model
  joinedAt: string;
  lastActive?: string;
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

interface TeamManagementProps {
  _organization: {
    id: string;
    name: string;
    slug: string;
  };
  userRole: string;
  members: TeamMember[];
  pendingInvitations?: PendingInvitation[];
  isLoading?: boolean;
  onInviteMember?: () => void;
  onUpdateMemberRole?: (memberId: string, role: string) => void;
  onRemoveMember?: (memberId: string) => void;
  onAssignFacilities?: (member: TeamMember) => void;
}

export function TeamManagement({
  _organization,
  userRole,
  members = [],
  pendingInvitations = [],
  isLoading = false,
  onInviteMember,
  onUpdateMemberRole,
  onRemoveMember,
  onAssignFacilities,
}: TeamManagementProps) {
  const t = useTranslations("ProviderModule.team");
  const format = useFormatter();

  const canManageTeam = userRole === "owner" || userRole === "admin";

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-800">
            {t("role.owner")}
          </Badge>
        );
      case "member":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800">
            {t("role.member")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format.dateTime(new Date(dateString), {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate stats
  const stats = {
    total: members.length,
    owners: members.filter((m) => m.role === "owner").length,
    members: members.filter((m) => m.role === "member").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("team")}</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">{t("manageTeamMembers")}</p>
        </div>
        {canManageTeam && onInviteMember && (
          <Button onClick={onInviteMember} size="lg" className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4 mr-2" />
            {t("inviteMember")}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("totalMembers")}
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t("teamMembers")}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("owners")}
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.owners}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t("organizationOwners")}
                </p>
              </>
            )}
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
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-28" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.members}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t("regularMembers")}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              {t("pendingInvitations")}
            </CardTitle>
            <CardDescription>{t("pendingInvitationsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => {
                const expiresAt = new Date(invitation.expiresAt);
                const isExpired = expiresAt < new Date();
                const daysUntilExpiry = Math.ceil(
                  (expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {invitation.email}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {invitation.role === "owner" ? t("role.owner") : t("role.member")}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {isExpired ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            {t("invitationExpired")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {daysUntilExpiry > 0
                              ? t("expiresInDays", { days: daysUntilExpiry })
                              : t("expiresToday")}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {t("invitedBy")} {invitation.inviterName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpired && (
                        <Badge variant="destructive" className="text-xs">
                          {t("expired")}
                        </Badge>
                      )}
                      {!isExpired && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800">
                          {t("pending")}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("teamMembers")}</CardTitle>
          <CardDescription>{t("teamMembersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            /* Table Loading Skeleton */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("memberRole")}</TableHead>
                    <TableHead>{t("facilities")}</TableHead>
                    <TableHead>{t("joinedAt")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : members.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("memberRole")}</TableHead>
                    <TableHead>{t("facilities")}</TableHead>
                    <TableHead>{t("joinedAt")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* Avatar with initials */}
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-emerald-700">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </div>
                          <div className="font-medium text-gray-900">
                            {member.name}
                          </div>
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
                        {member.role === "member" ? (
                          <div className="flex flex-wrap gap-1">
                            {member.facilities && member.facilities.length > 0 ? (
                              member.facilities.map((facility) => (
                                <Badge
                                  key={facility.id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {facility.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">
                                {t("noFacilities")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {t("allFacilities")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(member.joinedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {canManageTeam &&
                            member.role === "member" &&
                            onAssignFacilities && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onAssignFacilities(member)}
                              >
                                {t("assignFacilities")}
                              </Button>
                            )}
                          {/* 
                            SECURITY NOTE: Admin role is EXTREMELY sensitive and should NEVER be assigned 
                            by organization owners. Only platform admins (the platform owner) can assign 
                            admin roles. Organization owners can only manage owner and member roles.
                            
                            This button is intentionally disabled/removed to prevent security risks.
                            If role management is needed, it should only allow switching between 
                            owner and member roles, NEVER admin.
                          */}
                          {/* Role update functionality removed for security - admin role cannot be assigned by owners */}
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
