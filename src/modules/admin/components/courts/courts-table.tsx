"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";

interface Court {
  id: string;
  name: string;
  locationType: string | null;
  isActive: boolean;
  pricing: unknown;
  sportCategory: {
    id: string;
    name: string;
    facility: {
      id: string;
      name: string;
      address: string | null;
      organization: {
        name: string;
      } | null;
    };
  };
}

interface CourtsTableProps {
  courts: Court[];
}

export function CourtsTable({ courts }: CourtsTableProps) {
  const columns = [
    {
      accessorKey: "name",
      header: "Court Name",
      cell: ({ row }: { row: { original: Court } }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.locationType === "indoor" ? "Indoor" : 
             row.original.locationType === "outdoor" ? "Outdoor" : "N/A"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "sportCategory.name",
      header: "Sport",
      cell: ({ row }: { row: { original: Court } }) => (
        <Badge variant="outline">
          {row.original.sportCategory?.name || "N/A"}
        </Badge>
      ),
    },
    {
      accessorKey: "facility",
      header: "Facility",
      cell: ({ row }: { row: { original: Court } }) => (
        <div>
          <p className="font-medium">{row.original.sportCategory.facility.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.sportCategory.facility.organization?.name}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "pricing",
      header: "Hourly Rate",
      cell: ({ row }: { row: { original: Court } }) => {
        const pricing = row.original.pricing as { basicPrice?: number } | null;
        return <span>€{pricing?.basicPrice?.toFixed(2) || "0.00"}</span>;
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }: { row: { original: Court } }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return <DataTable columns={columns} data={courts} />;
}
