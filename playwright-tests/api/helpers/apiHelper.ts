import {APIRequestContext, Page, request} from '@playwright/test';
import config from '@tests/playwright.config';
import Duration from '@helpers/Duration';
import grafanaHelper from '@helpers/GrafanaHelper';
import {APIResponse} from "playwright-core";
import { ReadStream } from 'fs';

export interface Settings {
  pmm_public_address: string;
}

const getConfiguredRestApi = async (): Promise<APIRequestContext> => {
  return request.newContext({
    baseURL: config.use?.baseURL!,
    extraHTTPHeaders: {Authorization: `Basic ${await grafanaHelper.getToken()}`},
  });
};

const apiHelper = {
  //TODO: move it from the helper to proper file API? It's not actually API call.
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

  /**
   * @deprecated use {@link serverAPIv1#getPmmVersion()}
   */
  getPmmVersion: async () => {
    const restConfig = await getConfiguredRestApi();

    const response = await restConfig.get('/v1/version', {timeout: Duration.ThreeMinutes});
    const [versionMajor, versionMinor, versionPatch] = (await response.json()).version.split('.');
    return {versionMajor, versionMinor, versionPatch};
  },

  /**
   * @deprecated use {@link settingsAPIv1#changeSettings()}
   */
  changeSettings: async (settingsData: Settings) => {
    const restConfig = await getConfiguredRestApi();

    const response = await restConfig.post('/v1/Settings/Change', {data: settingsData});
    return await response.json();
  },

  //TODO: move it from the helper to proper file API. Suggestion: grafanaApi
  listOrgUsers: async () => {
    const restConfig = await getConfiguredRestApi();

    const response = await restConfig.get('/graph/api/org/users?accesscontrol=true');
    return await response.json();
  },

  //TODO: move it from the helper to proper file API? It's not actually API call.
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
   * Implements HTTP GET to PMM Server API
   * Request parameters can be configured with original clinet options.
   * See original doc for more details: {@link APIRequestContext#get()}
   *
   * @param   path      API endpoint path
   * @param   options   see original doc: {@link APIRequestContext#get()}
   * @return            Promise<APIResponse> instance
   */
  get: async (path: string, options?:
      {
        data?: any;
        failOnStatusCode?: boolean | undefined;
        form?: { [key: string]: string | number | boolean; } | undefined;
        headers?: { [key: string]: string; } | undefined;
        ignoreHTTPSErrors?: boolean | undefined;
        maxRedirects?: number | undefined;
        multipart?: {
          [key: string]: string | number | boolean | ReadStream | { name: string; mimeType: string; buffer: Buffer; };
        } | undefined;
        params?: { [key: string]: string | number | boolean; } | undefined;
        timeout?: number | undefined; } | undefined
  ): Promise<APIResponse> => {
    console.log(`GET: ${path}${options ? ` with ${options}` : ''}`);
    return (await getConfiguredRestApi()).get(path, options);
  },

  /**
   * Implements HTTP POST to PMM Server API
   *
   * @param   path      API endpoint path
   * @param   payload   request body {@code Object}
   * @return            Promise<APIResponse> instance
   */
  post: async (path: string, payload: Object): Promise<APIResponse> => {
      console.log(`POST: ${path}\nPayload: ${payload}`);
    return (await getConfiguredRestApi()).post(path, payload);
  },
};

export default apiHelper;
