import * as settingsApi from '@api/v1/settingsApi';
import {Page} from "@playwright/test";

export const v1 = {
  confirmTour: async (page: Page) => {
    await page.route('**/v1/user', (route) =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            user_id: 1,
            product_tour_completed: true,
            alerting_tour_completed: true,
          }),
        }),
    );
  },
  settings: settingsApi.settingsAPI,
}
