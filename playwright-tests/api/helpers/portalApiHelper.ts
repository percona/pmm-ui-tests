import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { Constants } from '@helpers/Constants';

const throwPortalRequestError = (e: string) => {
  throw new Error(`Failed to execute portal request. ${e}`);
};

const checkAndReturnResponse = (r: APIResponse) => {
  if (r.ok()) {
    return r.json();
  }
  throwPortalRequestError(`${r.status()} ${r.statusText()}`);
  return null;
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

export const getRequestContext = async ({ accessToken }: {
  baseURL?: string;
  accessToken?: string;
}): Promise<APIRequestContext> => {
  const options: ContextOptions = {
    baseURL: Constants.portal.url,
  };

  if (accessToken) {
    options.extraHTTPHeaders = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  return request.newContext(options);
};

export const portalAPIHelper = {
  async post(params: RequestParams) {
    return (await getRequestContext(params))
      .post(params.path, { data: params.data })
      .then((response: APIResponse) => checkAndReturnResponse(response))
      .catch(throwPortalRequestError);
  },

  async put(params: RequestParams) {
    return (await getRequestContext(params))
      .put(params.path, { data: params.data })
      .then(checkAndReturnResponse).catch(throwPortalRequestError);
  },

  async get(params: RequestParams) {
    return (await getRequestContext(params)).get(params.path)
      .then(checkAndReturnResponse).catch(throwPortalRequestError);
  },

  async delete(params: RequestParams) {
    return (await getRequestContext(params)).delete(params.path)
      .then(checkAndReturnResponse).catch(throwPortalRequestError);
  },
};
