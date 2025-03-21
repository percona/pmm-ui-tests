const { I } = inject();

class BaseDashboard {
  constructor() {
    this.elements = {
      expandedHeaders: locate('//button[@aria-expanded="true"]'),
      headerButton: locate('//button[contains(@data-testid, "dashboard-row-title")]'),
      headerText: locate('//*[@data-testid="header-container"]//h2[string-length(text()) > 1]'),
      noDataPanel: (panelName) => locate(`//section[contains(@data-testid, "${panelName}")]//*[@data-testid="data-testid Panel data error message" or @class="panel-empty" or text()="No data"]`),
    };
  }

  async verifyMetricsHaveData(expectedMetrics, expectedMissingMetrics = ['']) {
    let remainingExpectedMetrics = expectedMetrics;
    console.log(expectedMetrics);
    await this.#collapseAllHeaders();
    const numberOfHeaders = Number(await I.grabNumberOfVisibleElements(this.elements.headerButton));

    for (let i = 1; i <= numberOfHeaders; i++) {
      const availableHeaders = new Set();

      I.waitForVisible(this.elements.headerButton.at(i));
      I.click(this.elements.headerButton.at(i));
      I.waitForVisible(this.elements.headerText);
      for (let j = 0; j < 5; j++) {
        if (j > 0) I.pressKey('PageDown');

        const tempHeaders = await I.grabTextFromAll(this.elements.headerText);

        tempHeaders.forEach((header) => availableHeaders.add(header));
      }

      remainingExpectedMetrics = remainingExpectedMetrics.filter((metric) => !availableHeaders.has(metric));
      console.log(`Available headers ${availableHeaders.size}`);
      console.log(`RemainingExpectedMetrics: ${remainingExpectedMetrics.length}`);

      I.click(this.elements.headerButton.at(i));
    }
  }

  async #collapseAllHeaders() {
    let numOfElements = 1;

    I.waitForVisible(this.elements.expandedHeaders);
    while (numOfElements > 0) {
      numOfElements = await I.grabNumberOfVisibleElements(this.elements.expandedHeaders);
      if (numOfElements > 0) I.click(this.elements.expandedHeaders);
    }
  }
}

module.exports = new BaseDashboard();
module.exports.BaseDashboard = BaseDashboard;
