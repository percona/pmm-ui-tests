const assert = require('assert');
const AdmZip = require('adm-zip');
const buildUrl = require('build-url');

const systemMessageText = 'div[data-testid^="data-testid Alert"] > div';
const systemMessageButtonClose = '[aria-label="Close alert"]';
const warningLocator = '[data-testid="data-testid Alert warning"]';

module.exports = () => actor({

  verifyPopUpMessage(message, timeout = 30) {
    this.waitForElement(systemMessageText, timeout);
    this.see(message, systemMessageText);
    this.click(systemMessageButtonClose);
  },

  verifyWarning(message, timeout = 10) {
    this.waitForElement(warningLocator, timeout);
    this.see(message, warningLocator);
  },

  async verifyInvisible(selector, timeOutInSeconds = 1) {
    const start = new Date().getTime();
    const timeout = timeOutInSeconds * 1000;
    const interval = 0.1;

    while (true) {
      this.dontSeeElement(selector);
      await this.wait(interval);
      if (new Date().getTime() - start >= timeout) {
        this.say(`Element ${selector} was not visible on page for ${timeOutInSeconds} seconds`);

        return;
      }
    }
  },

  useDataQA: (selector) => `[data-testid="${selector}"]`,
  getSingleSelectOptionLocator: (optionName) => locate('[aria-label="Select option"]')
    .find('span')
    .withText(optionName.toString())
    .inside('[aria-label="Select options menu"]'),
  getClosePopUpButtonLocator: () => systemMessageButtonClose,
  getPopUpLocator: () => systemMessageText,

  seeElementsDisabled(locator) {
    this.seeAttributesOnElements(locator, { disabled: true });
  },

  seeElementsEnabled(locator) {
    this.seeAttributesOnElements(locator, { disabled: null });
  },

  async readZipArchive(filepath) {
    try {
      const zip = new AdmZip(filepath);

      return zip.getEntries().map(({ name }) => name);
    } catch (e) {
      return Error(`Something went wrong when reading a zip file ${filepath}. ${e}`);
    }
  },

  async readFileInZipArchive(zipPath, filePath) {
    try {
      const zip = new AdmZip(zipPath);

      return zip.readFile(filePath);
    } catch (e) {
      throw new Error(`Something went wrong when reading a zip file ${zipPath}. ${e}`);
    }
  },

  /**
   * Asserts that zip Archive contains elements specified in argument
   *
   * @param   filepath      a string path to target zip file
   * @param   entriesArray  an array with element which must be present in zip archive
   * @return  {Promise<void>}
   */
  async seeEntriesInZip(filepath, entriesArray) {
    this.assertDeepIncludeMembers(
      await this.readZipArchive(filepath),
      entriesArray,
      `Zip file: '${filepath}' must include: ${entriesArray}`,
    );
  },

  /**
   * Asserts that zip Archive does not contain elements specified in argument
   *
   * @param   filepath      a string path to target zip file
   * @param   entriesArray  an array with element which must not be present in zip archive
   * @return  {Promise<void>}
   */
  async dontSeeEntriesInZip(filepath, entriesArray) {
    const entries = await this.readZipArchive(filepath);

    // TODO: contribute this.assertDeepNotIncludeMembers(); to codecept-chai lib
    entriesArray.forEach((entry) => {
      this.assertFalse(entries.includes(entry), `'${entry}' must not be in ${entries}`);
    });
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
      if (await boolCallable()) {
        return;
      }

      // Check the timeout after evaluating main condition
      // to ensure conditions with a zero timeout can succeed.
      if (new Date().getTime() - start >= timeout) {
        assert.fail(`"${boolCallable.name}" is false: 
        tried to check for ${timeOutInSeconds} second(s) with ${interval} second(s) with interval`);
      }

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
  buildUrlWithParams(url, parameters) {
    const queryParams = {};

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
        case 'refresh':
          queryParams.refresh = value;
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

  signOut() {
    this.amOnPage('graph/logout');
  },
});
