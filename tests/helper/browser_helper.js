const Helper = codecept_helper;
const buildUrl = require('build-url');

class BrowserHelper extends Helper {
  async getTabs() {
    const { Playwright } = this.helpers;
    const { browserContext } = Playwright;

    return await browserContext.pages();
  }

  async openNewTabs(numberOfTabs) {
    const { Playwright } = this.helpers;
    const { browserContext } = Playwright;
    const tabs = [];

    for (let i = 0; i < numberOfTabs; i++) {
      const newTab = await browserContext.newPage();

      tabs.push(newTab);
    }

    return tabs;
  }

  async navigateTabTo(tab, address) {
    if (!address.includes('http')) {
      tab.goto(process.env.PMM_UI_URL + address);
    } else {
      tab.goto(address);
    }
  }

  async downloadFile(clickElementXpath) {
    const { page } = this.helpers.Playwright;

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click(clickElementXpath.value),
    ]);

    return await download.path();
  }

  async getClipboardText() {
    const { Playwright } = this.helpers;
    const { browserContext, page } = Playwright;

    await browserContext.grantPermissions(['clipboard-read']);

    return await page.evaluate(() => navigator.clipboard.readText());
  }
  /**
   * Create URL method
   *
   * @param url start
   * @param parameters object
   * @returns {Promise<void>}
   *
   * @example
   * buildUrlWithParameters('http://example.com', { environment: 'ps-dev', from: 'now-1' });
   */
  buildUrlWithParameters(url, parameters) {
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
  }
}

module.exports = BrowserHelper;
