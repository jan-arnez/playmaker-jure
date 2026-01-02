"use client";

import { Building2, Menu } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProviderContextProvider } from "@/context/provider-context";
import { CreateFacilityDialog } from "../dialog/create-facility-dialog";
import { ProviderSidebar } from "../sidebar/provider-sidebar";

interface ProviderDashboardLayoutProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
  };
  userRole: string;
  children: React.ReactNode;
}

export function ProviderDashboardLayout({
  organization,
  userRole,
  children,
}: ProviderDashboardLayoutProps) {
  const [showCreateFacility, setShowCreateFacility] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCreateFacility = () => {
    setShowCreateFacility(true);
    setMobileMenuOpen(false);
  };

  return (
    <ProviderContextProvider organization={organization} userRole={userRole}>
      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <ProviderSidebar />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="md:hidden fixed top-4 left-4 z-50"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <ProviderSidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <div className="md:hidden bg-white border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {organization.logo ? (
                  <Image
                    src={organization.logo}
                    alt={organization.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-lg"
                  />
                ) : (
                  <div className="h-8 w-8 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <h1 className="text-lg font-semibold text-gray-900">
                  {organization.name}
                </h1>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className="h-full">{children}</div>
          </main>
        </div>

        {/* Create Facility Dialog */}
        <CreateFacilityDialog
          open={showCreateFacility}
          onOpenChange={setShowCreateFacility}
          organizationId={organization.id}
        />
      </div>
    </ProviderContextProvider>
  );
}
