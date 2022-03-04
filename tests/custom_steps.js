const assert = require('assert');
const AdmZip = require('adm-zip');

const systemMessageText = '.page-alert-list div[data-testid^="data-testid Alert"] > div';
const systemMessageButtonClose = '.page-alert-list button';

module.exports = () => actor({

  verifyPopUpMessage(message, timeout = 30) {
    this.waitForElement(systemMessageText, timeout);
    this.see(message, systemMessageText);
    this.click(systemMessageButtonClose);
  },

  useDataQA: (selector) => `[data-testid="${selector}"]`,
  getSingleSelectOptionLocator: (optionName) => locate('[aria-label="Select option"]')
    .find('span')
    .withText(optionName)
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

  async seeEntriesInZip(filepath, entriesArray) {
    const entries = await this.readZipArchive(filepath);

    entriesArray.forEach((entry) => {
      assert.ok(entries.includes(entry));
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
    const timout = timeOutInSeconds * 1000;
    const interval = 1;

    /* eslint no-constant-condition: ["error", { "checkLoops": false }] */
    while (true) {
      // Main condition check
      if (await boolCallable()) {
        return;
      }

      // Check the timeout after evaluating main condition
      // to ensure conditions with a zero timeout can succeed.
      if (new Date().getTime() - start >= timout) {
        assert.fail(`"${boolCallable.name}" is false: 
        tried to check for ${timeOutInSeconds} second(s) with ${interval} second(s) with interval`);
      }

      this.wait(interval);
    }
  },

  getDashboardUrlWithParams(url, filters, timerange, searchValue = null, column = null, page_number = 1, page_size = 25) {
    let str = `${url}?`;

    for (const i in filters) {
      const { filterName, filterValue } = filters[i];

      str += filterName !== null && !filterValue.isEmpty ? `var-${filterName}=${filterValue}&` : '';
    }
    // str += node_name !== null && !node_name.isEmpty ? `var-node_name=${node_name}&` : '';
    // str += service_name !== null && !service_name.isEmpty ? `var-service_name=${service_name}&` : '';

    str += column !== null && !column.isEmpty ? `columns=%5B%22load%22,%22num_queries%22,%22query_time%22,%22${column}%5D&` : '';
    str += timerange !== null && !timerange.isEmpty ? `${timerange}&` : '';
    str += searchValue !== null && !searchValue.isEmpty ? `dimensionSearchText=${searchValue}&` : '';
    str += page_number !== null && !page_number.isEmpty ? `page_number=${page_number}&` : '';
    str += page_size !== null && !page_size.isEmpty ? `page_size=${page_size}&` : '';

    return str.slice(0, str.length - 1);
  },
});
