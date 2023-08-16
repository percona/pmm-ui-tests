import { server } from '@api/server';
import { settings } from '@tests/tests/configuration/api/settings';
import { oktaApi } from '@api/oktaApi';
import { portalAPI } from '@api/portalApi';
import { serviceNowAPI } from '@api/serviceNowApi';
import { inventory } from '@api/inventory';
import { management } from '@api/management';
import {apiHelper} from "@api/helpers/apiHelper";

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
    inventoryV1: inventory,
    settingsV1: settings,
    serverV1: server,
    managementV1: management,
  },
  okta: oktaApi,
  portal: portalAPI,
  serviceNow: serviceNowAPI,
};
