import { server } from '@api/server.api';
import { settingsApi } from '@tests/configuration/api/settings.api';
import { oktaApi } from '@api/okta.api';
import { serviceNowApi } from '@api/service-now.api';
import { inventoryApi } from '@api/inventory.api';
import { managementApi } from '@api/management.api';
import { orgApi } from '@api/org.api';

export interface OrgUser {
  orgId: number,
  userId: number,
  email: string,
  name: string,
  avatarUrl: string,
  login: string,
  role: string,
  lastSeenAt: string,
  lastSeenAtAge: string,
  accessControl: {
    'org.users:add': boolean,
    'org.users:read': boolean,
    'org.users:remove': boolean,
    'org.users:write': boolean
  },
  isDisabled: boolean
}

export interface ListRoles {
  roles: Role[]
}

export interface Role {
  role_id?: number,
  title: string,
  filter?: string,
  description?: string
}

/**
 * User facing api collection. Accessible on Frontend via /swagger path.
 * API version intentionally included into the API groups to have
 * obvious which API and which version is used.
 */
export const api = {
  grafana: { org: orgApi },
  pmm: {
    inventoryV1: inventoryApi,
    settingsV1: settingsApi,
    serverV1: server,
    managementV1: managementApi,
  },
  okta: oktaApi,
  serviceNow: serviceNowApi,
};
