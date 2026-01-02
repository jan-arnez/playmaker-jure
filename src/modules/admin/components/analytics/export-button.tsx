"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const exportTypes = [
  { type: "users", label: "Export Users" },
  { type: "bookings", label: "Export Bookings" },
  { type: "facilities", label: "Export Facilities" },
  { type: "organizations", label: "Export Organizations" },
];

export function ExportButton() {
  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/export?type=${type}`);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `${type}-export.csv`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`${type} data exported successfully`);
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {exportTypes.map((item) => (
          <DropdownMenuItem key={item.type} onClick={() => handleExport(item.type)}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
