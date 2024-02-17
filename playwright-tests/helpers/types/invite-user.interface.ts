import { PortalUserRoles } from '@helpers/enums/portal-user-roles';

interface InviteUserToOrg {
  username: string;
  role: PortalUserRoles | string;
}

export default InviteUserToOrg;
