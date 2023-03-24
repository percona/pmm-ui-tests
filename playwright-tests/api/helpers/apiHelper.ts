import {APIRequestContext, Page, request} from '@playwright/test';
import config from '@tests/playwright.config';
import Duration from '@helpers/Duration';
import grafanaHelper from '@helpers/GrafanaHelper';
import {APIResponse} from "playwright-core";

export interface Settings {
  pmm_public_address: string;
}

const getConfiguredRestApi = async (): Promise<APIRequestContext> => {
  return request.newContext({
    baseURL: config.use?.baseURL!,
    extraHTTPHeaders: { Authorization: `Basic ${await grafanaHelper.getToken()}` },
  });
};

const apiHelper = {


  getPmmVersion: async () => {
    const restConfig = await request.newContext({
      baseURL: config.use?.baseURL!,
      extraHTTPHeaders: { Authorization: `Basic ${await grafanaHelper.getToken()}` },
    });

    const response = await restConfig.get('/v1/version', { timeout: Duration.ThreeMinutes });
    const [versionMajor, versionMinor, versionPatch] = (await response.json()).version.split('.');
    return { versionMajor, versionMinor, versionPatch };
  },

  changeSettings: async (settingsData: Settings) => {
    const restConfig = await request.newContext({
      baseURL: config.use?.baseURL!,
      extraHTTPHeaders: { Authorization: `Basic ${await grafanaHelper.getToken()}` },
    });

    const response = await restConfig.post('/v1/Settings/Change', { data: settingsData });
    return await response.json();
  },

  listOrgUsers: async () => {
    const restConfig = await request.newContext({
      baseURL: config.use?.baseURL!,
      extraHTTPHeaders: { Authorization: `Basic ${await grafanaHelper.getToken()}` },
    });

    const response = await restConfig.get('/graph/api/org/users?accesscontrol=true');
    return await response.json();
  },

  async interceptBackEndCall(page: Page, interceptedRoute: string, data = {}) {
    await page.route(interceptedRoute, async (route) => {
      await route.fulfill({
        body: JSON.stringify(data),
        contentType: 'application/json',
        headers: {},
      });
    });
  },

  /**
   * Implements HTTP POST to PMM Server API
   *
   * @param   path      API endpoint path
   * @param   payload   request body {@code Object}
   * @return            Promise<APIResponse> instance
   */
  post: async (path: string, payload: Object): Promise<APIResponse> => {
    return (await getConfiguredRestApi()).post(path, payload);
  },
};

export default apiHelper;
