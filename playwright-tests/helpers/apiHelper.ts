import { request } from "@playwright/test";
import config from '../playwright.config';
import Duration from "./Duration";
import grafanaHelper from "./GrafanaHelper";

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

    const response = await restConfig.post('/v1/Updates/Check',{ timeout: Duration.ThreeMinutes });
    const [versionMajor, versionMinor, versionPatch] = (await response.json()).installed.version.split('.');
    return {versionMajor, versionMinor, versionPatch}
  },

  changeSettings: async (settingsData: Settings) => {
    const restConfig = await request.newContext({
      baseURL: config.use?.baseURL!,
      extraHTTPHeaders: { Authorization: `Basic ${await grafanaHelper.getToken()}` }
    });

    const response = await restConfig.post('/v1/Settings/Change', { data: settingsData });
    return await response.json();
  }
};

export default apiHelper;
