import { PortalUserRoles } from '@helpers/enums/portalUserRoles';

interface InviteUserToOrg {
  username: string;
  role: PortalUserRoles | string;
}

export default InviteUserToOrg;
