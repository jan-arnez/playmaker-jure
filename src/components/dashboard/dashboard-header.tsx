"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur-md px-4 md:px-6">
      <SidebarTrigger className="md:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SidebarTrigger>
      
      <div className="flex flex-col gap-0.5">
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground hidden md:block">{description}</p>
        )}
      </div>
    </header>
  );
}
