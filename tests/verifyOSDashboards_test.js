const nodes = new DataTable(['node-type', 'name']);
const assert = require('assert');
const { NODE_TYPE } = require('./helper/constants');

nodes.add(['pmm-client', 'ip']);

Feature('Test Dashboards inside the OS Folder');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'Open the Node Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    I.amOnPage(dashboardPage.nodeSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Node Name', 'pmm-server');
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.nodeSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
  },
);

Scenario(
  'Open the Nodes Compare Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    I.amOnPage(dashboardPage.nodesCompareDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistencePartialMatch(dashboardPage.nodesCompareDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
  },
);

Data(nodes).Scenario(
  'PMM-T418 PMM-T419 Verify the pt-summary on Node Summary dashboard @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    I.amOnPage(dashboardPage.nodeSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
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
  async ({
    I, dashboardPage, inventoryAPI,
  }) => {
    const nodes = await inventoryAPI.getAllNodes();
    const mergedNodes = nodes.filter((node) => node.node_type === 'generic' || node.node_type === 'container');
    // get first two generic node names
    const node1 = mergedNodes[0].node_name;
    const node2 = mergedNodes[1].node_name;
    const url = I.buildUrlWithParams(dashboardPage.nodesCompareDashboard.cleanUrl, {
      node_name: node1,
      from: 'now-5m',
    });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();

    const initialNumOfPanels = await I.grabNumberOfVisibleElements(dashboardPage.panel);

    I.scrollTo(dashboardPage.fields.metricTitle);
    I.forceClick(dashboardPage.fields.metricTitle);
    I.dontSeeElement(dashboardPage.graphsLocator(`${node2} - System Uptime`));
    I.seeElement(dashboardPage.graphsLocator(`${node1} - System Uptime`));

    await dashboardPage.applyFilter('Node Name', node2);
    I.scrollTo(dashboardPage.fields.metricTitle);
    I.forceClick(dashboardPage.fields.metricTitle);

    const finalNumOfPanels = await I.grabNumberOfVisibleElements(dashboardPage.panel);

    assert.ok(finalNumOfPanels > initialNumOfPanels, 'Number of panels should increase after adding another node for comparison');

    I.seeElement(dashboardPage.graphsLocator(`${node1} - System Uptime`));
    I.seeElement(dashboardPage.graphsLocator(`${node2} - System Uptime`));
  },
);
