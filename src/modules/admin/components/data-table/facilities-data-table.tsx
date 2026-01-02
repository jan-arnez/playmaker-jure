"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { FacilityTableActions } from "./facility-table-actions";

type Facility = {
  id: string;
  name: string;
  slug: string | null;
  city: string;
  address: string;
  status: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  _count: {
    sportCategories: number;
    bookings: number;
  };
};

const statusColors = {
  active: "bg-green-100 text-green-800",
  maintenance: "bg-amber-100 text-amber-800",
  inactive: "bg-gray-100 text-gray-800",
};

function useFacilityColumns(): ColumnDef<Facility>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell({ row }) {
        return (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.city}</p>
          </div>
        );
      },
    },
    {
      id: "organization",
      header: "Organization",
      cell({ row }) {
        return (
          <span className="text-sm text-muted-foreground">
            {row.original.organization.name}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell({ row }) {
        const status = row.original.status;
        return (
          <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: "sports",
      header: "Sports",
      cell({ row }) {
        return (
          <span className="text-muted-foreground">
            {row.original._count.sportCategories}
          </span>
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
      header: "Created",
      cell({ row }) {
        return format(row.original.createdAt, "MMM dd, yyyy");
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex-1 flex justify-end">
            <FacilityTableActions facility={row.original} />
          </div>
        );
      },
    },
  ];
}

interface FacilitiesDataTableProps {
  data: Facility[];
}

export function FacilitiesDataTable({ data }: FacilitiesDataTableProps) {
  const columns = useFacilityColumns();

  return <DataTable columns={columns} data={data} />;
}
