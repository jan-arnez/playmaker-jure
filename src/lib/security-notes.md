# Security Notes - Admin Role Assignment

## CRITICAL SECURITY WARNING

The **admin role** in the platform is EXTREMELY sensitive and has the following restrictions:

### 1. Admin Role Definition
- **Platform Admin (User.role === "admin")**: Platform-level administrator with access to all organizations and facilities across the entire platform. This is the platform owner role.
- **Organization Admin (Member.role === "admin")**: This role should NOT be used in the current implementation. Only "owner" and "member" roles are allowed for organization members.

### 2. Who Can Assign Admin Roles
- **ONLY** the platform owner (User.role === "admin") can assign admin roles
- **NEVER** organization owners (Member.role === "owner")
- **NEVER** any other user or role

### 3. Security Checks Required

#### Frontend (Client Components)
- Invite member forms MUST NOT include "admin" as a selectable role
- Role update functions MUST reject any attempt to set role to "admin"
- UI components MUST NOT display options to promote users to admin

#### Backend (API Endpoints)
- All API endpoints that accept role parameters MUST validate that:
  - If requester is organization owner, they CANNOT assign admin role
  - Only platform admins (User.role === "admin") can assign admin roles
  - Server-side validation is MANDATORY (client-side checks can be bypassed)

### 4. Files That Handle Role Assignment

#### Critical Files to Monitor:
- `src/app/[locale]/provider/[organizationSlug]/team/invite-member-dialog.tsx` - Invite form (admin role excluded)
- `src/modules/provider/components/team/team-management.tsx` - Role update UI (admin promotion removed)
- `src/app/[locale]/provider/[organizationSlug]/team/team-management-client.tsx` - Role update handler (admin check added)
- `src/app/api/admin/organizations/[organizationId]/members/route.ts` - Admin panel API (platform admin only)

### 5. Testing Checklist
- [ ] Organization owner cannot invite member with admin role
- [ ] Organization owner cannot promote member to admin role
- [ ] Organization owner cannot update member role to admin
- [ ] API endpoints reject admin role assignment from non-platform-admins
- [ ] UI does not display admin role as an option for organization owners

### 6. If Admin Role Assignment is Needed
If in the future there is a legitimate need to assign admin roles:
1. Create a separate, highly secured admin panel endpoint
2. Require platform admin authentication (User.role === "admin")
3. Add audit logging for all admin role assignments
4. Require additional confirmation steps
5. Notify platform owner of all admin role assignments

---

**Last Updated**: 2025-01-XX
**Reviewed By**: Platform Owner
**Status**: ACTIVE SECURITY POLICY

