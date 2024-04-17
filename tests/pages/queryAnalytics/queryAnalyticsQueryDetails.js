const assert = require('assert');

const { I, queryAnalyticsPage } = inject();

class QueryAnalyticsQueryDetails {
  constructor() {
    this.elements = {
      metricsCellDetailValue: (metricName, columnNumber) => locate(`//td//span[contains(text(), "${metricName}")]/ancestor::tr/td[${columnNumber}]//span[1]`),
      codeBlock: locate('//*[@data-testid="highlight-code" or contains(@class, "pretty-json-container")]'),
      noExamples: locate('//pre[contains(text(), "Sorry, no examples found for this query")]'),
      noClassic: '//pre[contains(text(), "No classic explain found")]',
      noJSON: '//pre[contains(text(), "No JSON explain found")]',
    };
    this.buttons = {
      tab: (tabName) => locate('button').withText(tabName),
      close: locate('button').find('span').withText('Close'),
    };
  }

  async verifyAverageQueryCount(timeRangeInSec = 300) {
    const qpsvalue = await I.grabTextFrom(this.elements.metricsCellDetailValue('Query Count', 2));
    let queryCountDetail = await I.grabTextFrom(this.elements.metricsCellDetailValue('Query Count', 3));

    queryCountDetail = this.getQueryCountValue(queryCountDetail);

    const result = (queryCountDetail / timeRangeInSec).toFixed(4);

    this.compareCalculation(qpsvalue, result);
  }

  async verifyAverageQueryTime(timeRangeInSec = 300) {
    const timeLocator = this.elements.metricsCellDetailValue('Query Time', 4);
    const countLocator = this.elements.metricsCellDetailValue('Query Count', 3);
    const loadLocator = this.elements.metricsCellDetailValue('Query Time', 2);

    /* eslint-disable prefer-const */
    let [perQueryStats, perQueryUnit] = (await I.grabTextFrom(timeLocator)).split(' ');

    if (perQueryUnit === 'ms') perQueryStats /= 1000;

    if (perQueryUnit === 'µs') perQueryStats /= 1000000;

    let queryCountDetail = await I.grabTextFrom(countLocator);

    queryCountDetail = this.getQueryCountValue(queryCountDetail);

    const [load] = (await I.grabTextFrom(loadLocator)).split(' ');
    const result = ((queryCountDetail * parseFloat(perQueryStats)) / timeRangeInSec).toFixed(4);

    this.compareCalculation(load, result);
  }

  getQueryCountValue(value) {
    let result = parseFloat(value);

    if (value.endsWith('k')) {
      result *= 1000;
    }

    return result;
  }

  compareCalculation(value, result) {
    switch (true) {
      case result < 0.01:
        assert.ok(value.startsWith('<0.01'), `Values don't match. Value: ${value}, calculated Result: ${result}`);
        break;
      case parseFloat(result) <= 0.0149:
        assert.ok(value.startsWith('0.01'), `Values don't match. Value: ${value}, calculated Result: ${result}`);
        break;
      default:
        assert.ok(parseFloat(parseFloat(result).toFixed(2)) === parseFloat(value), `Values don't match. Value: ${value}, calculated Result: ${result}`);
    }
  }

  checkExamplesTab(isNoExamplesVisible = false) {
    I.waitForVisible(this.buttons.tab('Examples'), 30);
    I.click(this.buttons.tab('Examples'));
    queryAnalyticsPage.waitForLoaded();
    I.waitForVisible(this.elements.codeBlock, 30);

    if (isNoExamplesVisible) { I.seeElement(this.elements.noExamples); } else { I.dontSeeElement(this.elements.noExamples); }
  }

  checkTab(tabName) {
    I.waitForVisible(this.buttons.tab(tabName), 30);
    I.click(this.buttons.tab(tabName));
    I.wait(5);
    queryAnalyticsPage.waitForLoaded();
    I.dontSeeElement(this.elements.noClassic);
    I.dontSeeElement(this.elements.noJSON);
  }

  waitForDetails() {
    I.waitForVisible(this.buttons.tab('Details'), 30);
    I.click(this.buttons.tab('Details'));
    I.wait(5);
    queryAnalyticsPage.waitForLoaded();
    I.dontSeeElement(this.elements.noClassic);
    I.dontSeeElement(this.elements.noJSON);
  }
}

module.exports = new QueryAnalyticsQueryDetails();
module.exports.QueryAnalyticsQueryDetails = QueryAnalyticsQueryDetails;
