"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/shared/data-table";
import { DialogProvider } from "@/context/dialog-context";
import { OrganizationTableActions } from "./organization-table-actions";
import { Badge } from "@/components/ui/badge";

type Organization = {
  id: string;
  name: string;
  slug: string | null;
  createdAt: Date;
  facilitiesCount: number;
  membersCount: number;
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
};

function useOrganizationColumns(): ColumnDef<Organization>[] {
  const t = useTranslations("AdminModule.organizationColumns");

  return [
    {
      accessorKey: "name",
      header: t("name"),
      cell({ row }) {
        return (
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.slug && (
              <p className="text-xs text-muted-foreground">{row.original.slug}</p>
            )}
          </div>
        );
      },
    },
    {
      id: "owner",
      header: "Owner",
      cell({ row }) {
        const owner = row.original.owner;
        if (!owner) {
          return (
            <Badge variant="outline" className="text-amber-600 bg-amber-50">
              No Owner
            </Badge>
          );
        }
        return (
          <div>
            <p className="font-medium text-sm">{owner.name}</p>
            <p className="text-xs text-muted-foreground">{owner.email}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "facilitiesCount",
      header: "Facilities",
      cell({ row }) {
        return (
          <span className="text-muted-foreground">
            {row.original.facilitiesCount}
          </span>
        );
      },
    },
    {
      accessorKey: "membersCount",
      header: "Members",
      cell({ row }) {
        return (
          <span className="text-muted-foreground">
            {row.original.membersCount}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: t("createdAt"),
      cell({ row }) {
        const createdAt: Date = row.getValue("createdAt");
        return format(createdAt, "MMM dd, yyyy");
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const organization = row.original;
        const organizationId = organization.id;

        return (
          <div className="flex-1 flex justify-end">
            <OrganizationTableActions
              organizationId={organizationId}
              organizationName={organization.name}
              organizationSlug={organization.slug}
            />
          </div>
        );
      },
    },
  ];
}

interface OrganizationsDataTableProps {
  data: Organization[];
}

export function OrganizationsDataTable({ data }: OrganizationsDataTableProps) {
  const columns = useOrganizationColumns();

  return (
    <DialogProvider>
      <DataTable columns={columns} data={data} />
    </DialogProvider>
  );
}
