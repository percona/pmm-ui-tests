const nodes = new DataTable(['node-type', 'name']);
const assert = require('assert');

nodes.add(['pmm-client', 'ip']);

Feature('Test Dashboards inside the OS Folder');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'Open the Node Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    I.amOnPage(dashboardPage.nodeSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.applyFilter('Node Name', 'pmm-server');
    I.click(adminPage.fields.metricTitle);
    await dashboardPage.expandEachDashboardRow();
    adminPage.performPageDown(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.nodeSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);

Scenario(
  'Open the Nodes Compare Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    I.amOnPage(dashboardPage.nodesCompareDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    dashboardPage.verifyMetricsExistence(dashboardPage.nodesCompareDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA(1);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(19);
  },
);

Data(nodes).Scenario(
  'PMM-T418 PMM-T419 Verify the pt-summary on Node Summary dashboard @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    I.amOnPage(dashboardPage.nodeSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    await dashboardPage.expandEachDashboardRow();
    adminPage.performPageUp(5);
    I.waitForElement(dashboardPage.nodeSummaryDashboard.ptSummaryDetail.reportContainer, 60);
    I.seeElement(dashboardPage.nodeSummaryDashboard.ptSummaryDetail.reportContainer);
  },
);

Scenario(
  'PMM-T1090: Verify time zones and navigation between dashboards @nightly @dashboards',
  async ({
    I, dashboardPage, adminPage, homePage,
  }) => {
    const timeZone = 'Europe/London';

    I.amOnPage(`${dashboardPage.processDetailsDashboard.url}`);
    dashboardPage.waitForDashboardOpened();
    adminPage.applyTimeZone(timeZone);
    I.click(homePage.fields.servicesButton);
    I.waitForElement(homePage.serviceDashboardLocator('MySQL Instances Overview'), 30);
    I.click(homePage.serviceDashboardLocator('MySQL Instances Overview'));
    dashboardPage.waitForDashboardOpened();
    I.waitForElement(adminPage.fields.timePickerMenu, 30);
    I.forceClick(adminPage.fields.timePickerMenu);
    I.waitForVisible(adminPage.getTimeZoneSelector(timeZone), 30);
    I.seeElement(adminPage.getTimeZoneSelector(timeZone));
  },
);

Scenario(
  'PMM-T1695 Verify that user is able to filter OS / Node Compare dashboard by Node Name @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    const nodeName = await I.verifyCommand(`pmm-admin inventory list nodes | awk '$2 ~ /^ip-/ {print $2}'`);

    I.amOnPage(dashboardPage.nodesCompareDashboard.url);
    dashboardPage.waitForDashboardOpened();

    // clear selections first
    dashboardPage.expandFilters('Node Name');
    I.click(dashboardPage.toggleAllValues);

    await dashboardPage.applyFilter('Node Name', 'pmm-server');
    await dashboardPage.expandEachDashboardRow();

    let numOfPanels = await I.grabNumberOfVisibleElements(dashboardPage.panel);

    assert.ok(numOfPanels === 28, `There should be 28 panels for one node but found "${numOfPanels}".`);

    I.scrollTo(adminPage.fields.metricTitle);
    I.dontSeeElement(dashboardPage.systemUptimePanel(nodeName));
    I.seeElement(dashboardPage.systemUptimePanel('pmm-server'));

    await dashboardPage.applyFilter('Node Name', nodeName);
    I.click(adminPage.fields.metricTitle);

    numOfPanels = await I.grabNumberOfVisibleElements(dashboardPage.panel);

    assert.ok(numOfPanels === 50, `There should be 50 panels for two nodes but found "${numOfPanels}".`);

    I.seeElement(dashboardPage.systemUptimePanel(nodeName));
    I.seeElement(dashboardPage.systemUptimePanel('pmm-server'));
  },
);
