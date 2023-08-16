import { APIRequestContext, APIResponse, expect, request } from '@playwright/test';
import { Constants } from '@helpers/Constants';

const checkAndReturnResponse = async (r: APIResponse) => {
  await expect(r, `Expected to be OK: ${r.status()} ${r.statusText()}`).toBeOK();
  return r.json();
};

export interface RequestParams {
  path: string;
  data?: any;
  accessToken?: string;
}

interface ContextOptions {
  baseURL: string;
  extraHTTPHeaders?: { [key: string]: string; };
}

const getRequestContext = async ({ accessToken }: { baseURL?: string; accessToken?: string; }): Promise<APIRequestContext> => {
  const options: ContextOptions = { baseURL: Constants.portal.url };
  if (accessToken) {
    options.extraHTTPHeaders = {
      Authorization: `Bearer ${accessToken}`,
    };
  }
  return request.newContext(options);
};

export const portalAPIHelper = {
  async post(params: RequestParams) {
    console.log(`POST: ${Constants.portal.url}${params.path}\nPayload: ${JSON.stringify(params.data)}`);
    return (await getRequestContext(params))
      .post(params.path, { data: params.data }).then(checkAndReturnResponse);
  },

  async put(params: RequestParams) {
    console.log(`PUT: ${Constants.portal.url}${params.path}\nPayload: ${JSON.stringify(params.data)}`);
    return (await getRequestContext(params))
      .put(params.path, { data: params.data }).then(checkAndReturnResponse);
  },

  async get(params: RequestParams) {
    console.log(`GET: ${Constants.portal.url}${params.path}`);
    return (await getRequestContext(params)).get(params.path).then(checkAndReturnResponse);
  },

  async delete(params: RequestParams) {
    console.log(`GET: ${Constants.portal.url}${params.path}`);
    return (await getRequestContext(params)).delete(params.path).then(checkAndReturnResponse);
  },
};
