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
    noExamples: locate('//pre[contains(text(), "Sorry, no examples found for this query")]').as('No examples message'),
    noClassic: '//pre[contains(text(), "No classic explain found")]',
    noJSON: '//pre[contains(text(), "No JSON explain found")]',
    examplesCodeBlock: '$pmm-overlay-wrapper',
    planInfoIcon: locate('$query-analytics-details').find('div').after('pre > code'),
    tooltipPlanId: locate('div').withChild('.tippy-box'),
    planText: locate('pre').find('code'),
    emptyPlanText: locate('pre').withText('No plan found'),
    topQuery: locate('$top-query').find('div'),
    histogramContainer: '$histogram-collapse-container',
  },

  getFilterSectionLocator: (filterSectionName) => `//span[contains(text(), '${filterSectionName}')]`,

  getTabLocator: (tabName) => locate('a').withText(tabName),

  getMetricsCellLocator: (metricName, columnNumber) => `//td//span[contains(text(), "${metricName}")]/ancestor::tr/td[${columnNumber}]//span[1]`,

  async verifyAvqQueryCount(timeRangeInSec = 300) {
    const qpsvalue = await I.grabTextFrom(this.getMetricsCellLocator('Query Count', 2));
    let queryCountDetail = await I.grabTextFrom(this.getMetricsCellLocator('Query Count', 3));

    queryCountDetail = this.getQueryCountValue(queryCountDetail);

    // We divide by 300 because we are using last 5 mins filter.
    const result = (queryCountDetail / timeRangeInSec).toFixed(4);

    compareCalculation(qpsvalue, result);
  },

  checkExamplesTab(isNoExamplesVisible = false) {
    I.waitForVisible(this.getTabLocator('Examples'), 30);
    I.click(this.getTabLocator('Examples'));
    qanFilters.waitForFiltersToLoad();
    I.waitForVisible(this.elements.examplesCodeBlock, 30);

    if (isNoExamplesVisible) { I.seeElement(this.elements.noExamples); } else { I.dontSeeElement(this.elements.noExamples); }
  },

  checkExplainTab() {
    I.waitForVisible(this.getTabLocator('Explain'), 30);
    I.click(this.getTabLocator('Explain'));
    I.wait(5);
    qanFilters.waitForFiltersToLoad();
    I.dontSeeElement(this.elements.noClassic);
    I.dontSeeElement(this.elements.noJSON);
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

  async getQueryExampleText() {
    this.checkExamplesTab();

    return await I.grabTextFrom('$highlight-code');
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
