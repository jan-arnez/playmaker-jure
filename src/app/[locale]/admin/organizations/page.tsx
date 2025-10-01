import { DialogProvider } from "@/context/dialog-context";
import { prisma } from "@/lib/prisma";
import { OrganizationsDataTable } from "@/modules/admin/components/data-table/organizations-data-table";
import { CreateOrganizationDialog } from "@/modules/admin/components/dialog/create-organization-dialog";

export default async function UsersPage() {
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  return (
    <div className="container space-y-6">
      <h1 className="text-3xl font-medium tracking-tight">Organizations</h1>
      <div className="flex-1 flex justify-end">
        <DialogProvider>
          <CreateOrganizationDialog />
        </DialogProvider>
      </div>
      <OrganizationsDataTable data={organizations} />
    </div>
  );
}
