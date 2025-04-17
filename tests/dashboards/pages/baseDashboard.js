const { I } = inject();

class BaseDashboard {
  constructor() {
    this.elements = {
      expandedGroups: locate('//button[@aria-expanded="true"]'),
      collapsedGroups: locate('//div[@data-testid="dashboard-row-container"]//button[@aria-expanded="false"]'),
      groupsButton: locate('//button[contains(@data-testid, "dashboard-row-title")]'),
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
    I.assertEqual(expectedMetrics.length, countOfVerifiedMetrics, `Count of actual panels on the dashboard does not equal expected one. Actual: ${countOfVerifiedMetrics}. Expected: ${expectedMetrics.length}`);
    I.assertTrue(remainingExpectedMetrics.length === 0, `Panels ${remainingExpectedMetrics} are missing on the dashboard`);
    I.assertTrue(failingPanels.size === 0, `Panels: "${[...failingPanels].join(', ')}" do not have data dashboard`);
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
