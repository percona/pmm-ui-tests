const { I } = inject();
const { QueryAnalyticsFilters } = require('./components/queryAnalytics/queryAnalyticsFilters');
const { QueryAnalyticsData } = require('./components/queryAnalytics/queryAnalyticsData');
const { DashboardLinkContainer } = require('./components/dashboardLinkContainer');
const { QueryAnalyticsQueryDetails } = require('./components/queryAnalytics/queryAnalyticsQueryDetails');

class QueryAnalyticsPage {
  constructor() {
    this.url = 'graph/d/pmm-qan/pmm-query-analytics';
    this.dashboardLinks = new DashboardLinkContainer();
    this.filters = new QueryAnalyticsFilters();
    this.data = new QueryAnalyticsData();
    this.queryDetails = new QueryAnalyticsQueryDetails();
    this.elements = {
      spinner: locate('//div[@data-testid="Spinner" or @class="preloader"]'),
      metricsSorting: (columnNumber) => locate('$sort-by-control').at(columnNumber),
      columnName: (columnName) => locate(`//span[text()="${columnName}"]`),
      clipboardLink: locate(I.getPopUpLocator()).find('span').find('span'),
      queryCountValue: locate('//*[@data-testid="query-analytics-details"]//span[text()="Query Count"]//ancestor::tr//td[3]//span[1]'),
    };
    this.buttons = {
      addColumnButton: '//span[contains(text(), "Add column")]',
      addColumn: '//ancestor::div[contains(@class, "add-columns-selector")]//input',
      searchDashboard: '//div[contains(@class, "input-wrapper")]',
      copyButton: locate(I.useDataQA('copy-link-button')),
      qanBreadcrumb: locate(I.useDataQA('data-testid Query Analytics breadcrumb')),
    };
  }

  waitForLoaded() {
    I.waitForDetached(this.elements.spinner, 60);
  }

  changeSorting(columnNumber) {
    I.waitForElement(this.elements.metricsSorting(columnNumber), 30);
    this.waitForLoaded();
    I.forceClick(this.elements.metricsSorting(columnNumber));
  }

  addColumn(columnName) {
    I.waitForVisible(this.buttons.addColumn, 30);
    I.fillField(this.buttons.addColumn, columnName);
    I.waitForVisible(this.elements.columnName(columnName), 30);
    I.click(this.elements.columnName(columnName));
  }

  async verifyQueryCount(expectedQueryCount) {
    I.waitForVisible(this.elements.queryCountValue);
    const queryCount = parseInt((await I.grabTextFrom(this.elements.queryCountValue)), 10);

    if (queryCount === parseInt(expectedQueryCount, 10)) return;

    throw new Error(`Query count of does not equal to excepted value: "${expectedQueryCount}", actual value is: "${queryCount}".`);
  }
}

module.exports = new QueryAnalyticsPage();
module.exports.QueryAnalyticsPage = QueryAnalyticsPage;
