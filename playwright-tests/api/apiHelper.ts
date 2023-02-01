import { Page, request } from "@playwright/test";
import config from '../playwright.config';
import Duration from "../helpers/Duration";
import grafanaHelper from "../helpers/GrafanaHelper";

export interface Settings {
  pmm_public_address: string;
}

const apiHelper = {
  confirmTour: async (page) => {
    await page.route('**/v1/user', (route) => route.fulfill({
      status: 200,
      body: JSON.stringify({
        user_id: 1,
        product_tour_completed: true,
        alerting_tour_completed: true,
      }),
    }));
  },

  getPmmVersion: async () => {
    const restConfig = await request.newContext({
      baseURL: config.use?.baseURL!,
      extraHTTPHeaders: { Authorization: `Basic ${await grafanaHelper.getToken()}` }
    });

    let response = await restConfig.post('/v1/Updates/Check', { timeout: Duration.ThreeMinutes });
    let [versionMajor, versionMinor, versionPatch] = (await response.json()).installed.version.split('.');
    if(!versionMajor) {
      response = await restConfig.post('/v1/Updates/Check', { timeout: Duration.ThreeMinutes });
    }
    [versionMajor, versionMinor, versionPatch] = (await response.json()).installed.version.split('.');
    return {versionMajor, versionMinor, versionPatch}
  },

  changeSettings: async (settingsData: Settings) => {
    const restConfig = await request.newContext({
      baseURL: config.use?.baseURL!,
      extraHTTPHeaders: { Authorization: `Basic ${await grafanaHelper.getToken()}` }
    });

    const response = await restConfig.post('/v1/Settings/Change', { data: settingsData });
    return await response.json();
  },

  listOrgUsers: async () => {
    console.log(`Base url is: ${config.use?.baseURL!}`);
    const restConfig = await request.newContext({
      baseURL: config.use?.baseURL!,
      extraHTTPHeaders: { Authorization: `Basic ${await grafanaHelper.getToken()}` }
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
};

export default apiHelper;
