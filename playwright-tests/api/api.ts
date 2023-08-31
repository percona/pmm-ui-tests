import { server } from '@api/server.api';
import { settingsApi } from '@tests/configuration/api/settings.api';
import { oktaApi } from '@api/okta.api';
import { portalApi } from '@api/portal.api';
import { serviceNowApi } from '@api/service-now.api';
import { inventoryApi } from '@api/inventory.api';
import { managementApi } from '@api/management.api';
import apiHelper from '@api/helpers/api-helper';

/**
 * User facing api collection. Accessible on Frontend via /swagger path.
 * API version intentionally included into the API groups to have
 * obvious which API and which version is used.
 */
export const api = {
  grafana: {
    // TODO: move it to proper file API. Suggestion: grafanaApi
    listOrgUsers: async () => {
      const response = await apiHelper.get('/graph/api/org/users?accesscontrol=true');
      console.log(`Response:\n${JSON.stringify(await response.json())}`);
      return response.json();
    },
  },
  pmm: {
    inventoryV1: inventoryApi,
    settingsV1: settingsApi,
    serverV1: server,
    managementV1: managementApi,
  },
  okta: oktaApi,
  portal: portalApi,
  serviceNow: serviceNowApi,
};
