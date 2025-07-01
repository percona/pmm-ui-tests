import shell from 'shelljs';
import assert from 'assert';
import buildUrl from 'build-url';
import { BuildUrlInterface } from './steps.interface';
import { config } from './codecept.conf';

export = function () {
  return actor({
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
          domain: config.config.helpers.Playwright.url.replace(/[^.\d]/g, ''),
          path: '/',
        };

        Playwright.setCookie(parsedCookie);
      });
    },

    async getAuth(username = 'admin', password = process.env.ADMIN_PASSWORD) {
      return Buffer.from(`${username}:${password}`).toString(
        'base64',
      );
    },
    async verifyCommand(command, output = null, result = 'pass', returnErrorPipe = false) {
      const { stdout, stderr, code } = shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: true });

      if (output && result === 'pass') {
        assert.ok(stdout.includes(output), `The "${command}" output expected to include "${output}" but found "${stdout}"`);
      }

      if (result === 'pass') {
        assert.ok(
          code === 0,
          `The "${command}" command was expected to run without any errors, but the error found: "${stderr || stdout}"`,
        );
      } else {
        assert.ok(
          code !== 0,
          `The "${command}" command was expected to exit with error code, but exited with success code: "${code}"`,
        );
      }

      if (returnErrorPipe) return stderr.trim();

      return stdout.trim();
    },
    /**
     * Fluent wait for the specified callable. Callable should be async and return bool value
     * Fails test if timeout exceeded.
     *
     * @param     boolCallable      should be a function with boolean return type
     * @param     timeOutInSeconds  time to wait for a service to appear
     * @returns   {Promise<void>}   requires await when called
     */
    async asyncWaitFor(boolCallable, timeOutInSeconds) {
      const start = new Date().getTime();
      const timeout = timeOutInSeconds * 1000;
      const interval = 1;

      /* eslint no-constant-condition: ["error", { "checkLoops": false }] */
      while (true) {
        // Main condition check
        // eslint-disable-next-line no-await-in-loop
        if (await boolCallable()) {
          return;
        }

        // Check the timeout after evaluating main condition
        // to ensure conditions with a zero timeout can succeed.
        if (new Date().getTime() - start >= timeout) {
          assert.fail(`"${boolCallable.name}" is false: 
        tried to check for ${timeOutInSeconds} second(s) with ${interval} second(s) with interval`);
        }

        // eslint-disable-next-line no-await-in-loop
        await this.wait(interval);
      }
    },
    /**
     * Create URL method
     *
     * @param url start
     * @param parameters object
     * @returns {Promise<void>}
     *
     * @example
     * buildUrlWithParams('http://example.com', { environment: 'ps-dev', from: 'now-1' });
     */
    buildUrlWithParams(url, parameters: BuildUrlInterface) {
      console.log(parameters);
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
    },
  });
}
