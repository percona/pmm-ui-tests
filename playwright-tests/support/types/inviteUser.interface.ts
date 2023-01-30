import { PortalUserRoles } from '../enums/portalUserRoles';

interface InviteUserToOrg {
  username: string;
  role: PortalUserRoles | string;
}

export default InviteUserToOrg;
