import buildUrl from 'build-url';
import Helper from '@codeceptjs/helper';
import { config } from "../../codecept.conf";

class BrowserHelper extends Helper {
  constructor(config) {
    super(config);
  }

  /**
   * Create URL method
   *
   * @param url - Base URL to build on
   * @param parameters - Query parameters as key-value pairs
   * @example
   * buildUrlWithParameters('http://example.com', { environment: 'ps-dev', from: 'now-1' });
   */
  buildUrlWithParameters(url: string, parameters:  Record<string, string>) {
    const queryParams: {
      from?: string,
      to?: string,
      columns?: string,
      dimensionSearchText?: string,
      page_number?: string,
      page_size?: string,
      refresh?: string,
      cluster?: string,
    } = {};

    queryParams.from = 'now-5m';
    queryParams.to = 'now';
    Object.entries(parameters).forEach(([key, value]) => {
      switch (key) {
        case 'environment':
          queryParams['var-environment'] = value;
          break;
        case 'node_name':
          queryParams['var-node_name'] = value;
          break;
        case 'cluster':
          queryParams['var-cluster'] = value;
          break;
        case 'service_name':
          queryParams['var-service_name'] = value;
          break;
        case 'application_name':
          queryParams['var-application_name'] = value;
          break;
        case 'database':
          queryParams['var-database'] = value;
          break;
        case 'columns':
          queryParams.columns = value;
          break;
        case 'from':
          queryParams.from = value;
          break;
        case 'to':
          queryParams.to = value;
          break;
        case 'search':
          queryParams.dimensionSearchText = value;
          break;
        case 'page_number':
          queryParams.page_number = value;
          break;
        case 'page_size':
          queryParams.page_size = value;
          break;
        case 'refresh':
          queryParams.refresh = value;
          break;
        default:
      }
    });

    return buildUrl(url, { queryParams });
  }

  useDataQA(selector: string) {
    return `[data-testid="${selector}"]`
  }

  async Authorize(username = 'admin', password = process.env.ADMIN_PASSWORD, baseUrl = '') {
    const { Playwright, REST } = this.helpers;
    const basicAuthEncoded = await this.getAuth(username, password);
    let resp;

    Playwright.setPlaywrightRequestHeaders({ Authorization: `Basic ${basicAuthEncoded}` });
    console.log('Setting new login header');
    try {
      resp = await REST.sendPostRequest(`${baseUrl}graph/login`, { user: username, password });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Login API call was not successful.');

      return;
    }

    const cookies = resp.headers['set-cookie'];

    if (!cookies) {
      // eslint-disable-next-line no-console
      console.warn('Authentication was not successful, verify base url and credentials.');

      return;
    }

    cookies.forEach((cookie) => {
      const parsedCookie = {
        name: cookie.split('=')[0],
        value: cookie.split('=')[1].split(';')[0],
        domain: config.helpers.Playwright.url.replace(/[^.\d]/g, ''),
        path: '/',
      };

      Playwright.setCookie(parsedCookie);
    });
  }

  async getAuth(username = 'admin', password = process.env.ADMIN_PASSWORD) {
    return Buffer.from(`${username}:${password}`).toString(
      'base64',
    );
  }
}

export = BrowserHelper;
