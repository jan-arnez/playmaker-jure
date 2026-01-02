"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { UserTableActions } from "./user-table-actions";
import { AlertTriangle, CheckCircle2, Shield, Star } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  trustLevel: number;
  weeklyBookingLimit: number;
  successfulBookings: number;
  activeStrikes: number;
  bookingBanUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    bookings: number;
  };
};

const trustLevelLabels = {
  0: { label: "Unverified", color: "bg-gray-100 text-gray-800", icon: null },
  1: { label: "Verified", color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
  2: { label: "Trusted", color: "bg-green-100 text-green-800", icon: Shield },
  3: { label: "Established", color: "bg-purple-100 text-purple-800", icon: Star },
};

function useUserColumns(): ColumnDef<User>[] {
  const t = useTranslations("AdminModule.userColumns");

  return [
    {
      accessorKey: "name",
      header: t("name"),
      cell({ row }) {
        const user = row.original;
        return (
          <div className="flex items-center space-x-2">
            <span className="font-medium">{user.name}</span>
            {user.banned && (
              <Badge variant="destructive" className="text-xs">
                Banned
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: t("email"),
    },
    {
      accessorKey: "role",
      header: t("role"),
      cell({ row }) {
        const role = row.getValue("role") as string | null;
        if (!role) return <Badge variant="secondary">User</Badge>;

        const roleColors = {
          admin: "bg-red-100 text-red-800",
          owner: "bg-purple-100 text-purple-800",
          member: "bg-blue-100 text-blue-800",
        };

        return (
          <Badge
            className={
              roleColors[role as keyof typeof roleColors] ||
              "bg-gray-100 text-gray-800"
            }
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "trustLevel",
      header: "Trust",
      cell({ row }) {
        const trustLevel = row.original.trustLevel as 0 | 1 | 2 | 3;
        const trust = trustLevelLabels[trustLevel] || trustLevelLabels[0];
        const Icon = trust.icon;

        return (
          <div className="flex items-center gap-1">
            {Icon && <Icon className="h-3 w-3" />}
            <Badge className={trust.color}>{trust.label}</Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "activeStrikes",
      header: "Strikes",
      cell({ row }) {
        const strikes = row.original.activeStrikes;
        if (!strikes) return <span className="text-muted-foreground">0</span>;

        return (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            <span className="font-medium text-amber-600">{strikes}</span>
          </div>
        );
      },
    },
    {
      id: "bookings",
      header: "Bookings",
      cell({ row }) {
        return (
          <span className="text-muted-foreground">
            {row.original._count.bookings}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: t("joinedAt"),
      cell({ row }) {
        const createdAt: Date = row.getValue("createdAt");
        return format(createdAt, "MMM dd, yyyy");
      },
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const user = row.original;
        const userId = user.id;

        return (
          <div className="flex-1 flex justify-end">
            <UserTableActions userId={userId} user={user} />
          </div>
        );
      },
    },
  ];
}

interface UsersDataTableProps {
  data: User[];
}

export function UsersDataTable({ data }: UsersDataTableProps) {
  const columns = useUserColumns();

  return <DataTable columns={columns} data={data} />;
}
