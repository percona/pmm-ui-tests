const { I } = inject();
const { BasePmmPage } = require('../basePmmPage');
const { QueryAnalyticsFilters } = require('./queryAnalyticsFilters');

class QueryAnalyticsPage extends BasePmmPage {
  constructor() {
    super();
    this.filters = new QueryAnalyticsFilters();
    this.elements = {
      spinner: locate('//div[@data-testid="Spinner"]'),
      mainMetricsContainer: locate('//div[@data-testid="group-by"]'),
      selectedMainMetric: () => this.elements.mainMetricsContainer.find('//span[@class="ant-select-selection-item"]'),
      mainMetricByName: (metricsName) => this.elements.selectedMainMetric().withText(metricsName),
      mainMetricFromDropdown: (metricName) => locate(`//div[@class="ant-select-item-option-content" and text()="${metricName}"]`),
      metricsSorting: (columnNumber) => locate(`(//a[@data-testid='sort-by-control'])[${columnNumber}]`),
      columnName: (columnName) => locate(`//span[text()="${columnName}"]`),
    };
    this.buttons = {
      addColumn: '//span[contains(text(), "Add column")]//ancestor::div[@class="ant-select-selector"]//input',
    };
  }

  async waitForLoaded() {
    await I.waitForDetached(this.elements.spinner, 60);
  }

  async changeMainMetric(newMainMetric) {
    const oldMainMetric = await I.grabTextFrom(this.elements.selectedMainMetric());

    await I.click(this.elements.mainMetricsContainer);
    await I.click(this.elements.mainMetricFromDropdown(newMainMetric));
    await I.waitForDetached(this.elements.mainMetricByName(oldMainMetric), 10);
    await I.waitForElement(this.elements.mainMetricByName(newMainMetric), 10);
  }

  async verifyMainMetric(mainMetric) {
    await I.waitForVisible(this.elements.mainMetricByName(mainMetric));
  }

  async changeSorting(columnNumber) {
    await I.waitForElement(this.elements.metricsSorting(columnNumber), 30);
    await this.waitForLoaded();
    await I.forceClick(this.elements.metricsSorting(columnNumber));
  }

  async addColumn(columnName) {
    await I.fillField(this.buttons.addColumn, columnName);

    await I.waitForVisible(this.elements.columnName(columnName), 30);
    await I.click(this.elements.columnName(columnName));
  }
}

module.exports = new QueryAnalyticsPage();
module.exports.QueryAnalyticsPage = QueryAnalyticsPage;
