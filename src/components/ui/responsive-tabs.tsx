"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
}

interface ResponsiveTabsProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function ResponsiveTabs({
  items,
  activeTab,
  onTabChange,
  className,
}: ResponsiveTabsProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Tabs */}
      <div className="hidden md:flex border-b border-gray-200">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === item.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Mobile Tabs - Scrollable */}
      <div className="md:hidden">
        <div className="w-full overflow-x-auto">
          <div className="flex space-x-1 pb-2">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex-shrink-0",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-white text-gray-700"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 mr-1" />}
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
