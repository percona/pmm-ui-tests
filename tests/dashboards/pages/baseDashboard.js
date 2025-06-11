const { I } = inject();

class BaseDashboard {
  constructor() {
    this.elements = {
      expandedGroups: locate('//button[@aria-label="Collapse row"]'),
      collapsedGroups: locate('//button[contains(@data-testid, "dashboard-row-title") and @aria-label="Expand row"]'),
      groupsButton: locate('//button[contains(@data-testid, "dashboard-row-title")]'),
      headerText: locate('//*[@data-testid="header-container"]//h2[string-length(text()) > 1]'),
      panelByName: (text) => locate(`//section[@data-testid="data-testid Panel header ${text}"]`),
      noDataPanel: (panelName) => locate(`//section[contains(@data-testid, "${panelName}")]//*[contains(@data-testid, "Panel data error message") or text()="No data" or text()="N/A"]`),
      variableLabel: (variableName) => locate(`//label[contains(@data-testid, "Label ${variableName}")]`),
      removeSelectedVariable: (variableName) => locate(`//label[contains(@data-testid, "Label ${variableName}")]//parent::div//button[@aria-label="Remove"]`),
      variableInput: (variableName) => locate(`//label[contains(@data-testid, "Label ${variableName}")]//parent::div//input`),
    };
  }

  async verifyData(expectedMetrics, expectedMissingMetrics = ['']) {
    let remainingExpectedMetrics = expectedMetrics;
    let countOfVerifiedMetrics = 0;
    const failingPanels = new Set();

    I.waitForVisible(this.elements.headerText, 10);
    // Collapse all groups of panels to verify them separately, if we do it all at once, we gate false negatives.
    await this.#collapseAllGroups();
    const numberOfGroups = Number(await I.grabNumberOfVisibleElements(this.elements.groupsButton));

    await I.usePlaywrightTo('Verify dashboard data', async ({ page }) => {
      for (let i = 1; i <= numberOfGroups; i++) {
        const availableHeadersInGroup = new Set();

        // Open Group of panel, to verify.
        await page.locator(this.elements.groupsButton.toXPath()).nth(i - 1).click();
        await page.locator(this.elements.headerText.toXPath()).first().waitFor({ state: 'visible' });
        await page.waitForTimeout(500);
        for (let j = 0; j < 10; j++) {
          if (j > 0) await page.keyboard.press('PageDown');

          // Get all the panel names.
          const tempHeaders = await Promise.all((await page.locator(this.elements.headerText.toXPath())
            .all())
            .map(async (element) => await element.textContent()));

          tempHeaders.forEach((header) => availableHeadersInGroup.add(header));

          for (const availableHeader of availableHeadersInGroup) {
            if (expectedMissingMetrics.indexOf(availableHeader) === -1) {
              // Verify that panel has data.
              if (await page.locator(this.elements.noDataPanel(availableHeader).toXPath()).count() > 0) {
                failingPanels.add(availableHeader);
              }
            }
          }
        }

        // Remove verified panels from expected list and increase count of panels verified
        remainingExpectedMetrics = remainingExpectedMetrics.filter((metric) => !availableHeadersInGroup.has(metric));
        countOfVerifiedMetrics += availableHeadersInGroup.size;

        // Close tested group
        await page.locator(this.elements.groupsButton.toXPath()).nth(i - 1).click();
      }
    });

    await this.#expandAllGroups();

    I.scrollPageToTop();

    if (failingPanels.size !== 0) {
      for (const failingPanel of failingPanels) {
        I.scrollTo(this.elements.panelByName(failingPanel));
        I.saveScreenshot(`panel-with-no-data-${failingPanel.replace(/[_ ]/g, '-')}.png`);
      }
    }

    I.assertEqual(expectedMetrics.length, countOfVerifiedMetrics, `Count of actual panels on the dashboard does not equal expected one. Actual: ${countOfVerifiedMetrics}. Expected: ${expectedMetrics.length}`);
    I.assertTrue(remainingExpectedMetrics.length === 0, `Panels ${remainingExpectedMetrics} are missing on the dashboard`);
    I.assertTrue(failingPanels.size === 0, `Panels: "${[...failingPanels].join(', ')}" do not have data dashboard`);
  }

  #selectVariable(variable, value) {
    I.waitForVisible(this.elements.variableLabel(variable), 10);
    I.click(this.elements.removeSelectedVariable(variable));
    I.fillField(this.elements.variableInput(variable), value);
    I.pressKey('Enter');
    I.pressKey('Escape');
  }

  #unSelectVariable(variable) {
    I.waitForVisible(this.elements.variableLabel(variable), 10);
    I.click(this.elements.removeSelectedVariable(variable));
    I.pressKey('Escape');
  }

  selectEnvironment(envName) {
    this.#selectVariable('Environment', envName);
  }

  unselectEnvironment() {
    this.#unSelectVariable('Environment');
  }

  selectCluster(clusterName) {
    this.#selectVariable('Cluster', clusterName);
  }

  unselectCluster() {
    this.#unSelectVariable('Cluster');
  }

  selectReplicationSet(replicationSet) {
    this.#selectVariable('Replication Set', replicationSet);
  }

  unselectReplicationSet() {
    this.#unSelectVariable('Replication Set');
  }

  selectNode(serviceName) {
    this.#selectVariable('Node', serviceName);
  }

  unselectNode() {
    this.#unSelectVariable('Node');
  }

  async #collapseAllGroups() {
    let numOfElements = 1;

    while (numOfElements > 0) {
      numOfElements = await I.grabNumberOfVisibleElements(this.elements.expandedGroups);
      if (numOfElements > 0) I.click(this.elements.expandedGroups);
    }
  }

  async #expandAllGroups() {
    let numOfElements = 1;

    while (numOfElements > 0) {
      numOfElements = await I.grabNumberOfVisibleElements(this.elements.collapsedGroups);
      if (numOfElements > 0) I.click(this.elements.collapsedGroups);
    }
  }
}

module.exports = new BaseDashboard();
module.exports.BaseDashboard = BaseDashboard;
