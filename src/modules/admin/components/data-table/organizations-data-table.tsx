"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/shared/data-table";
import { DialogProvider } from "@/context/dialog-context";
import { OrganizationTableActions } from "./organization-table-actions";

type Organization = {
  id: string;
  name: string;
  createdAt: Date;
};

function useOrganizationColumns(): ColumnDef<Organization>[] {
  const t = useTranslations("AdminModule.organizationColumns");

  return [
    {
      accessorKey: "name",
      header: t("name"),
    },
    {
      accessorKey: "createdAt",
      header: t("createdAt"),
      cell({ row }) {
        const createdAt: Date = row.getValue("createdAt");
        return format(createdAt, "MMM dd, yyyy hh:mm a");
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
