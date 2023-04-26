import { server } from "@api/server";
import { settings } from "@tests/api/settings";
import { oktaAPI } from "@api/okta";
import { portalAPI } from "@api/portalApi";
import { platform } from "@api/platform";
import { management } from "@api/management";

/**
 * User facing api collection. Accessible on Frontend via /swagger path.
 * API version intentionally included into the API groups to have
 * obvious which API and which version is used.
 */
export const api = {
  grafana: {},
  pmm: {
    settingsV1: settings,
    serverV1: server,
    platformV1: platform,
    managementV1: management,
  },
  okta: oktaAPI,
  portal: portalAPI,
}
