import { Page } from '@playwright/test';

export default class NetworkTools {
  constructor(readonly page: Page) { }

  // TODO: move it to api calls way
  suppressTour = async () => {
    await this.page.route('**/v1/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user_id: 1,
          product_tour_completed: true,
          alerting_tour_completed: true,
          snoozed_pmm_version: '3.2.0',
        }),
      });
    });
  };

  /**
   * Intercepts page specified request and mocks response with specified data
   *
   * @param   requestPath
   *          A glob pattern, regex pattern or predicate receiving [URL] to match while routing.
   *          To get more examples see original doc: {@link Page#route()}
   *
   * @param   response
   *          An object to return by intercepted request
   */
  interceptRequest = async (requestPath: string, response = {}) => {
    await this.page.route(requestPath, async (route) => {
      await route.fulfill({
        body: JSON.stringify(response),
        contentType: 'application/json',
        headers: {},
      });
    });
  };
}
