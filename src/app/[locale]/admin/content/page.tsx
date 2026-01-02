import { prisma } from "@/lib/prisma";
import { FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HomepageCMS } from "@/modules/admin/components/settings/homepage-cms";
import { EmailTemplateEditor } from "@/modules/admin/components/settings/email-template-editor";
import { getSetting } from "@/lib/settings";

export default async function AdminContentPage() {
  // Fetch all facilities for the picker
  const facilities = await prisma.facility.findMany({
    select: {
      id: true,
      name: true,
      city: true,
      organization: {
        select: { name: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Get current homepage settings
  const [featuredFacilities, popularFacilities, freeThisWeekend] = await Promise.all([
    getSetting<string[]>("homepage.featuredFacilities"),
    getSetting<string[]>("homepage.popularFacilities"),
    getSetting<string[]>("homepage.freeThisWeekend"),
  ]);

  // Get email templates
  const emailTemplates = await prisma.platformSettings.findMany({
    where: { category: "email-templates" },
  });

  const templates = emailTemplates.reduce((acc, t) => {
    acc[t.key] = t.value as { subject: string; body: string };
    return acc;
  }, {} as Record<string, { subject: string; body: string }>);

  return (
    <div className="container space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Content Management</h1>
          <p className="text-muted-foreground">
            Manage homepage content and email templates
          </p>
        </div>
      </div>

      <Tabs defaultValue="homepage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="homepage">Homepage CMS</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="homepage">
          <HomepageCMS
            facilities={facilities}
            initialSettings={{
              featuredFacilities: featuredFacilities || [],
              popularFacilities: popularFacilities || [],
              freeThisWeekend: freeThisWeekend || [],
            }}
          />
        </TabsContent>

        <TabsContent value="email">
          <EmailTemplateEditor initialTemplates={templates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
