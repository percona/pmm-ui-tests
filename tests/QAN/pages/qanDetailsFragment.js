const assert = require('assert');

const { I, qanFilters } = inject();

module.exports = {
  root: '$query-analytics-details',
  fields: {},
  buttons: {
    close: locate('button').find('span').withText('Close'),
  },
  elements: {
    resizer: 'span.Resizer.horizontal',
    noExamples: '//pre[contains(text(), "Sorry, no examples found for this query")]',
    noClassic: '//pre[contains(text(), "No classic explain found")]',
    noJSON: '//pre[contains(text(), "No JSON explain found")]',
    examplesCodeBlock: '$pmm-overlay-wrapper',
    tablesBlocks: '[data-testid="query-analytics-details"] [data-testid="pmm-overlay-wrapper"]',
    planInfoIcon: locate('$query-analytics-details').find('div').after('pre > code'),
    tooltipPlanId: locate('.popper__background.popper__background--info'),
    planText: locate('pre').find('code'),
    emptyPlanText: locate('pre').withText('No plan found'),
  },

  getFilterSectionLocator: (filterSectionName) => `//span[contains(text(), '${filterSectionName}')]`,

  getTabLocator: (tabName) => locate('li > a').withText(tabName),

  getMetricsCellLocator: (metricName, columnNumber) => `//td//span[contains(text(), "${metricName}")]/ancestor::tr/td[${columnNumber}]//span[1]`,

  async verifyAvqQueryCount(timeRangeInSec = 300) {
    const qpsValue = await I.grabTextFrom(this.getMetricsCellLocator('Query Count', 2));
    let queryCountDetail = await I.grabTextFrom(this.getMetricsCellLocator('Query Count', 3));

    queryCountDetail = this.getQueryCountValue(queryCountDetail);

    // We divide by 300 because we are using last 5 mins filter.
    const result = (queryCountDetail / timeRangeInSec).toFixed(4);

    compareCalculation(qpsValue, result);
  },

  checkExamplesTab() {
    I.waitForVisible(this.getTabLocator('Examples'), 30);
    I.click(this.getTabLocator('Examples'));
    qanFilters.waitForFiltersToLoad();
    I.waitForVisible(this.elements.examplesCodeBlock, 30);
    I.dontSeeElement(this.elements.noExamples);
  },

  checkExplainTab() {
    I.waitForVisible(this.getTabLocator('Explain'), 30);
    I.click(this.getTabLocator('Explain'));
    I.wait(5);
    qanFilters.waitForFiltersToLoad();
    I.dontSeeElement(this.elements.noClassic);
    I.dontSeeElement(this.elements.noJSON);
  },

  checkTablesTab() {
    I.waitForVisible(this.getTabLocator('Tables'), 30);
    I.click(this.getTabLocator('Tables'));
    I.wait(5);
    qanFilters.waitForFiltersToLoad();
    I.seeNumberOfElements(this.elements.tablesBlocks, 2);
  },

  checkPlanTab() {
    I.waitForVisible(this.getTabLocator('Plan'), 30);
    I.click(this.getTabLocator('Plan'));
    I.wait(5);
    qanFilters.waitForFiltersToLoad();
    I.dontSeeElement(this.elements.noClassic);
    I.dontSeeElement(this.elements.noJSON);
  },

  async checkPlanTabIsNotEmpty() {
    I.dontSeeElement(this.elements.emptyPlanText);
    I.waitForVisible(this.elements.planText, 20);
    const text = await I.grabTextFrom(this.elements.planText);

    assert.ok(text.length > 0, 'Plan text length must be more than 0');
  },

  checkPlanTabIsEmpty() {
    I.waitForVisible(this.elements.emptyPlanText, 20);
    I.dontSeeElement(this.elements.planInfoIcon);
  },

  mouseOverPlanInfoIcon() {
    I.moveCursorTo(this.elements.planInfoIcon);
    I.waitForVisible(this.elements.tooltipPlanId, 30);
  },

  async verifyAvgQueryTime(timeRangeInSec = 300) {
    const timeLocator = this.getMetricsCellLocator('Query Time', 4);
    const countLocator = this.getMetricsCellLocator('Query Count', 3);
    const loadLocator = this.getMetricsCellLocator('Query Time', 2);

    /* eslint-disable prefer-const */
    let [perQueryStats, perQueryUnit] = (await I.grabTextFrom(timeLocator)).split(' ');

    if (perQueryUnit === 'ms') perQueryStats /= 1000;

    if (perQueryUnit === 'µs') perQueryStats /= 1000000;

    let queryCountDetail = await I.grabTextFrom(countLocator);

    queryCountDetail = this.getQueryCountValue(queryCountDetail);

    const [load] = (await I.grabTextFrom(loadLocator)).split(' ');
    const result = ((queryCountDetail * parseFloat(perQueryStats)) / timeRangeInSec).toFixed(4);

    compareCalculation(load, result);
  },

  getQueryCountValue(value) {
    let result = parseFloat(value);

    if (value.endsWith('k')) {
      result *= 1000;
    }

    return result;
  },

  async verifyDetailsNotEmpty() {
    const queryCountValue = await I.grabTextFrom(this.getMetricsCellLocator('Query Count', 3));
    const queryTimeValue = await I.grabTextFrom(this.getMetricsCellLocator('Query Time', 3));
    const rowsSentValue = await I.grabTextFrom(this.getMetricsCellLocator('Rows Sent', 3));
    const sbCacheHitsValue = await I.grabTextFrom(this.getMetricsCellLocator('Shared Block Cache Hits', 3));
    const uCpuTimeValue = await I.grabTextFrom(this.getMetricsCellLocator('User CPU time', 3));
    const sCpuTimeValue = await I.grabTextFrom(this.getMetricsCellLocator('System CPU time', 3));

    I.assertTrue(queryCountValue.length > 0, '"Query Count" sum length must be more than 0');
    I.assertTrue(queryTimeValue.length > 0, '"Query Time" sum length must be more than 0');
    I.assertTrue(rowsSentValue.length > 0, '"Rows Sent" sum length must be more than 0');
    I.assertTrue(sbCacheHitsValue.length > 0, '"Shared Block Cache Hits" Time sum length must be more than 0');
    I.assertTrue(uCpuTimeValue.length > 0, '"User CPU time" sum length must be more than 0');
    I.assertTrue(sCpuTimeValue.length > 0, '"System CPU time" sum length must be more than 0');
  },
};

function compareCalculation(value, result) {
  const caller = compareCalculation.caller.name;

  switch (true) {
    case result < 0.01:
      assert.ok(value.startsWith('<0.01'), `Values don't match in the ${caller} method. Value: ${value}, calculated Result: ${result}`);
      break;
    case parseFloat(result) <= 0.0149:
      assert.ok(value.startsWith('0.01'), `Values don't match in the ${caller} method. Value: ${value}, calculated Result: ${result}`);
      break;
    default:
      assert.ok(parseFloat(parseFloat(result).toFixed(2)) === parseFloat(value), `Values don't match in the ${caller} method. Value: ${value}, calculated Result: ${result}`);
  }
}
