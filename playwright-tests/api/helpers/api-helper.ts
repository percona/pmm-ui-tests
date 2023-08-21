import {
  APIRequestContext, Page, expect, request,
} from '@playwright/test';
import config from '@root/playwright.config';
import grafanaHelper from '@helpers/grafana-helper';
import { APIResponse } from 'playwright-core';
import { ReadStream } from 'fs';

const getConfiguredRestApi = async (): Promise<APIRequestContext> => {
  return request.newContext({
    baseURL: config.use?.baseURL,
    extraHTTPHeaders: {
      Authorization: `Basic ${grafanaHelper.getToken()}`,
    },
    ignoreHTTPSErrors: true,
  });
};

const apiHelper = {
  // TODO: move it from the helper to proper file API? It's not actually API call.
  confirmTour: async (page: Page) => {
    await page.route('**/v1/user', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user_id: 1,
          product_tour_completed: true,
          alerting_tour_completed: true,
        }),
      });
    });
  },

  // TODO: move it from the helper to proper file API? It's not actually API call.
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
    timeout?: number | undefined;
  } | undefined): Promise<APIResponse> => {
    console.log(`GET: ${path}${options ? ` with ${JSON.stringify(options)}` : ''}`);
    const response = await (await getConfiguredRestApi()).get(path, options);

    await expect(response, `Expected to be OK: ${response.status()} ${response.statusText()}`).toBeOK();

    return response;
  },

  /**
   * Implements HTTP POST to PMM Server API
   *
   * @param   path      API endpoint path
   * @param   payload   request body {@code Object}
   * @return            Promise<APIResponse> instance
   */
  post: async (path: string, payload: object): Promise<APIResponse> => {
    console.log(`POST: ${path}\nPayload: ${JSON.stringify(payload)}`);
    const response = await (await getConfiguredRestApi()).post(path, payload);
    expect(response.status(), `Status: ${response.status()} ${response.statusText()}`).toEqual(200);
    return response;
  },
};
export default apiHelper;
