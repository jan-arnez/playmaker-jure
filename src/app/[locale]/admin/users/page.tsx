import { prisma } from "@/lib/prisma";
import { UsersDataTable } from "@/modules/admin/components/data-table/users-data-table";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {users.length} total users
        </div>
      </div>
      <UsersDataTable data={users} />
    </div>
  );
}
