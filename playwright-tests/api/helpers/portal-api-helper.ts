import {
  APIRequestContext, APIResponse, expect, request,
} from '@playwright/test';
import constants from '@helpers/constants';

const checkAndReturnResponse = async (r: APIResponse) => {
  await expect(r, `Expected to be OK: ${r.status()} ${r.statusText()}`).toBeOK();
  console.log(`Status: ${r.status()} ${r.statusText()}`);
  return r.json();
};

export interface RequestParams {
  path: string;
  data?: any;
  accessToken?: string;
  /**
   * Request timeout in milliseconds. Defaults to `30000` (30 seconds). Pass `0` to disable timeout.
   */
  timeout?: number;
}

interface ContextOptions {
  baseURL: string;
  extraHTTPHeaders?: { [key: string]: string; };
  timeout?: number;
}

const getRequestContext = async (
  { accessToken, timeout }: { accessToken?: string; timeout?: number; },
): Promise<APIRequestContext> => {
  const options: ContextOptions = { baseURL: constants.portal.url, timeout };
  if (accessToken) {
    options.extraHTTPHeaders = { Authorization: `Bearer ${accessToken}` };
  }
  return request.newContext(options);
};

export const portalApiHelper = {
  async post(params: RequestParams) {
    console.log(`POST: ${constants.portal.url}${params.path}`);
    return (await getRequestContext(params))
      .post(params.path, { data: params.data }).then(checkAndReturnResponse);
  },

  async put(params: RequestParams) {
    console.log(`PUT: ${constants.portal.url}${params.path}\nPayload: ${JSON.stringify(params.data)}`);
    return (await getRequestContext(params))
      .put(params.path, { data: params.data }).then(checkAndReturnResponse);
  },

  async get(params: RequestParams) {
    console.log(`GET: ${constants.portal.url}${params.path}`);
    return (await getRequestContext(params)).get(params.path).then(checkAndReturnResponse);
  },

  async delete(params: RequestParams) {
    console.log(`DELETE: ${constants.portal.url}${params.path}`);
    return (await getRequestContext(params)).delete(params.path).then(checkAndReturnResponse);
  },
};
