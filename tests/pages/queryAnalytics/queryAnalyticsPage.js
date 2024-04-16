const { I } = inject();
const { QueryAnalyticsFilters } = require('./queryAnalyticsFilters');
const { QueryAnalyticsData } = require('./queryAnalyticsData');
const { DashboardLinkContainer } = require('../components/dashboardLinkContainer');
const { QueryAnalyticsQueryDetails } = require('./queryAnalyticsQueryDetails');

class QueryAnalyticsPage {
  constructor() {
    this.url = 'graph/d/pmm-qan/pmm-query-analytics';
    this.dashboardLinks = new DashboardLinkContainer();
    this.filters = new QueryAnalyticsFilters();
    this.data = new QueryAnalyticsData();
    this.queryDetails = new QueryAnalyticsQueryDetails();
    this.elements = {
      spinner: locate('//div[@data-testid="Spinner"]'),
      mainMetricsContainer: locate('//div[@data-testid="group-by"]'),
      selectedMainMetric: () => this.elements.mainMetricsContainer.find('///div[@class="ant-select-selection-selected-value"]'),
      mainMetricByName: (metricsName) => this.elements.selectedMainMetric().withText(metricsName),
      mainMetricFromDropdown: (metricName) => locate(`//li[@class="ant-select-dropdown-menu-item" and text()="${metricName}"]`),
      metricsSorting: (columnNumber) => locate(`(//a[@data-testid='sort-by-control'])[${columnNumber}]`),
      columnName: (columnName) => locate(`//span[text()="${columnName}"]`),
    };
    this.buttons = {
      addColumnButton: '//span[contains(text(), "Add column")]',
      addColumn: '//ancestor::div[contains(@class, "add-columns-selector")]//input',
      searchDashboard: '//div[contains(@class, "input-wrapper")]',
    };

  }

  waitForLoaded() {
    I.waitForDetached(this.elements.spinner, 60);
  }

  async changeMainMetric(newMainMetric) {
    const oldMainMetric = await I.grabTextFrom(this.elements.selectedMainMetric());

    I.click(this.elements.mainMetricsContainer);
    I.click(this.elements.mainMetricFromDropdown(newMainMetric));
    I.waitForDetached(this.elements.mainMetricByName(oldMainMetric), 10);
    I.waitForElement(this.elements.mainMetricByName(newMainMetric), 10);
  }

  verifyMainMetric(mainMetric) {
    I.waitForVisible(this.elements.mainMetricByName(mainMetric));
  }

  changeSorting(columnNumber) {
    I.waitForElement(this.elements.metricsSorting(columnNumber), 30);
    this.waitForLoaded();
    I.forceClick(this.elements.metricsSorting(columnNumber));
  }

  addColumn(columnName) {
    I.fillField(this.buttons.addColumn, columnName);
    I.waitForVisible(this.elements.columnName(columnName), 30);
    I.click(this.elements.columnName(columnName));
  }
}

module.exports = new QueryAnalyticsPage();
module.exports.QueryAnalyticsPage = QueryAnalyticsPage;
