const { I } = inject();

class BaseDashboard {
  constructor() {
    this.elements = {
      expandedHeaders: locate('//button[@aria-expanded="true"]'),
      headerButton: locate('//button[contains(@data-testid, "dashboard-row-title")]'),
      headerText: locate('//*[@data-testid="header-container"]//h2[string-length(text()) > 1]'),
      noDataPanel: (panelName) => locate(`//section[contains(@data-testid, "${panelName}")]//*[contains(@data-testid, "Panel data error message") or text()="No data" or text()="N/A"]`),
      environmentInput: locate('//input[@id="var-environment"]'),
      environmentButton: locate('//button[@id="var-environment"]'),
      clusterInput: locate('//input[@id="var-cluster"]'),
      clusterButton: locate('//button[@id="var-cluster"]'),
      replicationSetInput: locate('//input[@id="var-replication_set"]'),
      replicationSetButton: locate('//button[@id="var-replication_set"]'),
      serviceNameInput: locate('//input[@id="var-service_name"]'),
      serviceNameButton: locate('//button[@id="var-service_name"]'),
      annotationsLabel: locate('//label[text()="PMM Annotations"]'),
    };
  }

  async verifyData(expectedMetrics, expectedMissingMetrics = ['']) {
    let remainingExpectedMetrics = expectedMetrics;
    let countOfVerifiedMetrics = 0;
    const failingPanels = new Set();

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

        for (const availableHeader of availableHeaders) {
          if (expectedMissingMetrics.indexOf(availableHeader) === -1) {
            if (await I.grabNumberOfVisibleElements(this.elements.noDataPanel(availableHeader)) > 0) {
              failingPanels.add(availableHeader);
            }
          }
        }
      }

      remainingExpectedMetrics = remainingExpectedMetrics.filter((metric) => !availableHeaders.has(metric));
      countOfVerifiedMetrics += availableHeaders.size;
      console.log(availableHeaders);

      I.click(this.elements.headerButton.at(i));
    }

    I.assertEqual(expectedMetrics.length, countOfVerifiedMetrics, `Count of actual panels on the dashboard does not equal expected one. Actual: ${countOfVerifiedMetrics}. Expected: ${expectedMetrics.length}`);
    I.assertTrue(remainingExpectedMetrics.length === 0, `Panels ${remainingExpectedMetrics} are missing on the dashboard`);
    I.assertTrue(failingPanels.length === 0, `Panels: "${[...failingPanels].join(' ')}" do not have data dashboard`);
  }

  selectEnvironment(envName) {
    I.waitForVisible(this.elements.environmentButton, 10);
    I.click(this.elements.environmentButton);
    I.fillField(this.elements.environmentInput, envName);
    I.pressKey('Enter');
    I.click(this.elements.annotationsLabel);
  }

  selectCluster(envName) {
    I.waitForVisible(this.elements.clusterButton, 10);
    I.click(this.elements.clusterButton);
    I.fillField(this.elements.clusterInput, envName);
    I.pressKey('Enter');
    I.click(this.elements.annotationsLabel);
  }

  selectReplicationSet(replicationSet) {
    I.waitForVisible(this.elements.replicationSetButton, 10);
    I.click(this.elements.replicationSetButton);
    I.fillField(this.elements.replicationSetInput, replicationSet);
    I.pressKey('Enter');
    I.click(this.elements.annotationsLabel);
  }

  selectServiceName(serviceName) {
    I.waitForVisible(this.elements.serviceNameButton, 10);
    I.click(this.elements.serviceNameButton);
    I.fillField(this.elements.serviceNameInput, serviceName);
    I.pressKey('Enter');
    I.click(this.elements.annotationsLabel);
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
