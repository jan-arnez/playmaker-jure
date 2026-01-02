import { prisma } from "@/lib/prisma";
import { Settings } from "lucide-react";
import { SettingsForm } from "@/modules/admin/components/settings/settings-form";
import { defaultSettings } from "@/lib/settings";

export default async function AdminSettingsPage() {
  // Check if PlatformSettings table exists
  let settings: Record<string, unknown> = { ...defaultSettings };
  let tableExists = true;

  try {
    const dbSettings = await prisma.platformSettings.findMany();
    // Merge DB settings with defaults
    dbSettings.forEach((s) => {
      settings[s.key] = s.value;
    });
  } catch {
    tableExists = false;
  }

  if (!tableExists) {
    return (
      <div className="container space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure global platform settings
            </p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 font-medium">Migration Required</p>
          <p className="text-amber-700 text-sm mt-1">
            Run <code className="bg-amber-100 px-1 rounded">npx prisma db push</code> to create the settings table.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure global platform settings
          </p>
        </div>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
