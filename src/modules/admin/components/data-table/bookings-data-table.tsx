"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { BookingTableActions } from "./booking-table-actions";
import type { Decimal } from "@prisma/client/runtime/library";

type Booking = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  price: Decimal | null;
  paymentStatus: string | null;
  isSeasonal: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  facility: {
    id: string;
    name: string;
  };
  court: {
    id: string;
    name: string;
  } | null;
};

const statusColors = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

const paymentStatusColors = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

function useBookingColumns(): ColumnDef<Booking>[] {
  return [
    {
      id: "datetime",
      header: "Date & Time",
      cell({ row }) {
        return (
          <div>
            <p className="font-medium">
              {format(row.original.startTime, "MMM dd, yyyy")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(row.original.startTime, "HH:mm")} -{" "}
              {format(row.original.endTime, "HH:mm")}
            </p>
          </div>
        );
      },
    },
    {
      id: "user",
      header: "Customer",
      cell({ row }) {
        return (
          <div>
            <p className="font-medium text-sm">{row.original.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.user.email}
            </p>
          </div>
        );
      },
    },
    {
      id: "facility",
      header: "Facility & Court",
      cell({ row }) {
        return (
          <div>
            <p className="font-medium text-sm">{row.original.facility.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.court?.name || "N/A"}
            </p>
          </div>
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
      accessorKey: "paymentStatus",
      header: "Payment",
      cell({ row }) {
        const paymentStatus = row.original.paymentStatus;
        if (!paymentStatus) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge
            variant="outline"
            className={paymentStatusColors[paymentStatus as keyof typeof paymentStatusColors] || ""}
          >
            {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Price",
      cell({ row }) {
        const price = row.original.price;
        if (!price) return <span className="text-muted-foreground">-</span>;
        return <span>€{Number(price).toFixed(2)}</span>;
      },
    },
    {
      id: "type",
      header: "Type",
      cell({ row }) {
        return row.original.isSeasonal ? (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Seasonal
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">Regular</span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex-1 flex justify-end">
            <BookingTableActions booking={row.original} />
          </div>
        );
      },
    },
  ];
}

interface BookingsDataTableProps {
  data: Booking[];
}

export function BookingsDataTable({ data }: BookingsDataTableProps) {
  const columns = useBookingColumns();

  return <DataTable columns={columns} data={data} />;
}
