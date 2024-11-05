import {
  APIRequestContext, Page, expect, request,
} from '@playwright/test';
import config from '@root/playwright.config';
import grafanaHelper from '@helpers/grafana-helper';
import { APIResponse } from 'playwright-core';
import { ReadStream } from 'fs';
import { Serializable } from 'playwright-core/types/structs';

const getConfiguredRestApi = async (): Promise<APIRequestContext> => {
  return request.newContext({
    baseURL: config.use?.baseURL,
    extraHTTPHeaders: { Authorization: `Basic ${grafanaHelper.getToken()}` },
    ignoreHTTPSErrors: true,
  });
};

const apiHelper = {
  // TODO: remove in favor of xxxPage.network.suppressTour().
  confirmTour: async (page: Page) => {
    await page.route('**/v1/users/me', async (route) => {
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
  },

  /**
   * Implements HTTP GET to PMM Server API
   * Request parameters can be configured with original client options.
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

  /**
   * Implements HTTP PUT to PMM Server API
   *
   * @param   path      API endpoint path
   * @param   payload   request body {@code Object}
   * @return            Promise<APIResponse> instance
   */
  put: async (path: string, payload: object): Promise<APIResponse> => {
    console.log(`PUT: ${path}\nPayload: ${JSON.stringify(payload)}`);
    const response = await (await getConfiguredRestApi()).put(path, { data: payload });
    expect(response.status(), `Status: ${response.status()} ${response.statusText()}`).toEqual(200);
    return response;
  },

  /**
   * Implements HTTP DELETE to PMM Server API
   * Request parameters can be configured with original client options.
   * See original doc for more details: {@link APIRequestContext#delete()}
   *
   * @param   path      API endpoint path
   * @param   options   see original doc: {@link APIRequestContext#delete()}
   * @return            Promise<APIResponse> instance
   */
  delete: async (path: string, options?:
  {
    data?: string | Buffer | Serializable,
    failOnStatusCode?: boolean,
    form?: { [p: string]: string | number | boolean },
    headers?: { [p: string]: string },
    ignoreHTTPSErrors?: boolean,
    maxRedirects?: number,
    multipart?: { [p: string]: string | number | boolean | ReadStream | { name: string, mimeType: string, buffer: Buffer } },
    params?: { [p: string]: string | number | boolean }, timeout?: number
  }): Promise<APIResponse> => {
    console.log(`DELETE: ${path}${options ? ` with ${JSON.stringify(options)}` : ''}`);
    const response = await (await getConfiguredRestApi()).delete(path, options);
    expect(response.status(), `Status: ${response.status()} ${response.statusText()}`).toEqual(200);
    return response;
  },
};
export default apiHelper;
