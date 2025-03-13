const Helper = codecept_helper;
const assert = require('assert');
const fs = require('fs');
const shell = require('shelljs');
const config = require('../../pr.codecept');

class Grafana extends Helper {
  constructor(config) {
    super(config);
    this.resultFilesFolder = `${global.output_dir}/`;
    this.signInWithSSOButton = '//a[contains(@href,"login/generic_oauth")]';
    this.ssoLoginUsername = '//input[@id="idp-discovery-username"]';
    this.ssoLoginNext = '//input[@id="idp-discovery-submit"]';
    this.ssoLoginPassword = '//input[@id="okta-signin-password"]';
    this.ssoLoginSubmit = '//input[@id="okta-signin-submit"]';
    this.mainView = '//main[contains(@class, "main-view")]';
  }

  async loginWithSSO(username, password) {
    const { page } = this.helpers.Playwright;

    await page.isVisible(this.mainView);
    await page.click(this.signInWithSSOButton);
    await page.fill(this.ssoLoginUsername, username);
    await page.click(this.ssoLoginNext);
    await page.click(this.ssoLoginPassword);
    await page.fill(this.ssoLoginPassword, password);
    await page.click(this.ssoLoginSubmit);
  }

  async Authorize(username = 'admin', password = process.env.ADMIN_PASSWORD, baseUrl = undefined) {
    const { Playwright, REST } = this.helpers;
    const basicAuthEncoded = await this.getAuth(username, password);

    Playwright.setPlaywrightRequestHeaders({ Authorization: `Basic ${basicAuthEncoded}` });
    let resp;

    if (baseUrl) {
      console.log(`Auth Url is: ${baseUrl}graph/login`);
      resp = await REST.sendPostRequest(`${baseUrl}graph/login`, { user: username, password });
    } else {
      resp = await REST.sendPostRequest('graph/login', { user: username, password });
    }

    console.log(resp.data);

    const cookies = resp.headers['set-cookie'];

    if (!cookies) {
      throw new Error('Authentication was not successful, verify base url and credentials.');
    }

    console.log(`Response cookies are: ${cookies}`);
    console.log(`Count of response cookies are: ${cookies.length}`);

    cookies.forEach((cookie) => {
      const parsedCookie = {
        name: cookie.split('=')[0],
        value: cookie.split('=')[1].split(';')[0],
        domain: config.config.helpers.Playwright.url.replace(/[^.\d]/g, ''),
        path: '/',
      };

      Playwright.setCookie(parsedCookie);
    });
  }

  async enableProductTour(snooze = false) {
    const { Playwright } = this.helpers;

    await Playwright.page.route('**/v1/users/me', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            user_id: 1,
            product_tour_completed: false,
            alerting_tour_completed: false,
            snoozed_pmm_version: snooze ? '3.2.0' : '',
          }),
        });
      } else {
        await route.continue();
      }
    });
  }

  async stopMockingProductTourApi() {
    const { Playwright } = this.helpers;

    await Playwright.page.unroute('**/v1/users/me');
  }

  async unAuthorize() {
    const { Playwright } = this.helpers;
    const { browserContext } = Playwright;

    await browserContext.clearCookies();
    Playwright.setPlaywrightRequestHeaders({});
  }

  async getBrowserCookies() {
    const { Playwright } = this.helpers;
    const { browserContext } = Playwright;

    return await browserContext.cookies();
  }

  async getBrowserGrafanaSessionCookies() {
    const { Playwright } = this.helpers;
    const { browserContext } = Playwright;

    const cookies = await browserContext.cookies();

    return await cookies.find((cookie) => cookie.name === 'grafana_session');
  }

  async getAuth(username = 'admin', password = process.env.ADMIN_PASSWORD) {
    return Buffer.from(`${this.config.username || username}:${this.config.password || password}`).toString(
      'base64',
    );
  }

  async readFile(path) {
    try {
      return fs.readFileSync(path, 'utf8');
    } catch (e) {
      assert.ok(false, `Could not read the file ${path}`);
    }

    return null;
  }

  /**
   * Mock Response of a Request from Server
   *
   * example Usage: await I.mockServer(endPoint, responseBody);
   *
   * @param requestToBeMocked       Request end point which needs to be routed and mocked.
   * @param responseBody            Response we want to Mock for the API call.
   * for example: Add Remote Instance, Access Inventory List
   * @returns {Promise<void>}
   */
  async mockServer(requestToBeMocked, responseBody) {
    const { browserContext } = this.helpers.Playwright;
    const existingPages = await browserContext.pages();
    const mainPage = existingPages[0];

    mainPage.route(requestToBeMocked, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          responseBody,
        ]),
      });
    });
  }

  /**
   * Wait for Request to be triggered from User Action
   *
   * example Usage: await I.waitForEndPointRequest(endPoint, element);
   *
   * @param endpoint       Endpoint which will be called on click of an element
   * @param element        Playwright to wait for the request
   * for example: Download Zip log request via Settings get diagnostics button
   * @returns {Promise<void>}
   */
  async waitForEndPointRequest(endpoint, element) {
    const { browserContext } = this.helpers.Playwright;
    const existingPages = await browserContext.pages();
    const mainPage = existingPages[0];

    const [request] = await Promise.all([
      // Waits for the next request with the specified url
      mainPage.waitForRequest(endpoint),
      // Triggers the request
      mainPage.click(element),
    ]);
  }

  async grabNumberOfTabs() {
    const { browserContext } = this.helpers.Playwright;
    const existingPages = await browserContext.pages();

    return existingPages.length;
  }

  async moveCursor(locator) {
    const { page } = this.helpers.Playwright;

    page.hover(locator);
  }

  async createUser(username, password) {
    const apiContext = this.helpers.REST;
    const body = {
      name: username,
      email: '',
      login: username,
      password,
    };
    const headers = { Authorization: `Basic ${await this.getAuth()}` };
    const resp = await apiContext.sendPostRequest('graph/api/admin/users', body, headers);

    return resp.data.id;
  }

  async setRole(userId, role = 'Viewer') {
    const apiContext = this.helpers.REST;
    const body = {
      role,
    };
    const headers = { Authorization: `Basic ${await this.getAuth()}` };

    await apiContext.sendPatchRequest(`graph/api/orgs/1/users/${userId}`, body, headers);
  }

  async deleteUser(userId) {
    const apiContext = this.helpers.REST;
    const headers = { Authorization: `Basic ${await this.getAuth()}` };

    await apiContext.sendDeleteRequest(`graph/api/admin/users/${userId}`, headers);
  }

  async listUsers() {
    const apiContext = this.helpers.REST;
    const headers = { Authorization: `Basic ${await this.getAuth()}` };
    const resp = await apiContext.sendGetRequest('graph/api/users/search', headers);

    return resp.data;
  }

  async listOrgUsers() {
    const apiContext = this.helpers.REST;
    const headers = { Authorization: `Basic ${await this.getAuth()}` };
    const resp = await apiContext.sendGetRequest('graph/api/org/users', headers);

    return resp.data;
  }

  async verifyCommand(command, output = null, result = 'pass', returnErrorPipe = false) {
    const { stdout, stderr, code } = shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: true });

    if (output && result === 'pass') {
      assert.ok(stdout.includes(output), `The "${command}" output expected to include "${output}" but found "${stdout}"`);
    }

    if (result === 'pass') {
      assert.ok(code === 0, `The "${command}" command was expected to run without any errors, but the error found: "${stderr || stdout}"`);
    } else {
      assert.ok(code !== 0, `The "${command}" command was expected to exit with error code, but exited with success code: "${code}"`);
    }

    if (returnErrorPipe) return stderr.trim();

    return stdout.trim();
  }
}

module.exports = Grafana;
