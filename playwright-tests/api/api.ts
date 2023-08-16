import { server } from '@api/server';
import { settings } from '@tests/tests/configuration/api/settings';
import { oktaApi } from '@api/oktaApi';
import { portalAPI } from '@api/portalApi';
import { serviceNowAPI } from '@api/serviceNowApi';
import { inventory } from '@api/inventory';
import { management } from '@api/management';

/**
 * User facing api collection. Accessible on Frontend via /swagger path.
 * API version intentionally included into the API groups to have
 * obvious which API and which version is used.
 */
export const api = {
  grafana: {},
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
