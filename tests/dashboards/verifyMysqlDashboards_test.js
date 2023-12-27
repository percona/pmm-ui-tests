const { dashboardPage, homePage } = inject();
const assert = require('assert');

const {
  inventoryAPI,
} = inject();
let services;
const serviceList = [];

const urlsAndMetrics = new DataTable(['metricName', 'startUrl']);

urlsAndMetrics.add(['Client Connections (All Host Groups)', `${dashboardPage.proxysqlInstanceSummaryDashboard.url}?from=now-5m&to=now`]);
urlsAndMetrics.add(['PMM Upgrade', homePage.url]);

Feature('Test Dashboards inside the MySQL Folder');

BeforeSuite(async ({ I }) => {
  const ps_service_response = await inventoryAPI.apiGetNodeInfoForAllNodesByServiceName('MYSQL_SERVICE', 'ps_');
  const ms_service_response = await inventoryAPI.apiGetNodeInfoForAllNodesByServiceName('MYSQL_SERVICE', 'ms-');
  const md_service_response = await inventoryAPI.apiGetNodeInfoForAllNodesByServiceName('MYSQL_SERVICE', 'md_');
  const pxc_service_response = await inventoryAPI.apiGetNodeInfoForAllNodesByServiceName('MYSQL_SERVICE', 'pxc_');

  services = ps_service_response.concat(ms_service_response, md_service_response, pxc_service_response);
  for (const nodeInfo of services) {
    serviceList.push(nodeInfo.service_name);
  }
});

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T317 - Open the MySQL Instance Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({
    I, adminPage, dashboardPage,
  }) => {
    for (const serviceName of serviceList) {
      const url = I.buildUrlWithParams(dashboardPage.mysqlInstanceSummaryDashboard.clearUrl, { service_name: serviceName, from: 'now-15m' });

      I.amOnPage(url);
      dashboardPage.waitForDashboardOpened();
      await dashboardPage.expandEachDashboardRow();
      I.click(adminPage.fields.metricTitle);
      adminPage.performPageDown(5);
      dashboardPage.verifyMetricsExistence(dashboardPage.mysqlInstanceSummaryDashboard.metrics);
      // eslint-disable-next-line no-inline-comments
      await dashboardPage.verifyThereAreNoGraphsWithNA(1); // FIXME: 0 N/As once https://jira.percona.com/browse/PMM-10308 is fixed
      await dashboardPage.verifyThereAreNoGraphsWithoutData(5);
    }
  },
);

Scenario(
  'PMM-T319 - Open the MySQL Instances Overview dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, adminPage, dashboardPage }) => {
    for (const serviceName of serviceList) {
      const url = I.buildUrlWithParams(dashboardPage.mySQLInstanceOverview.clearUrl, { service_name: serviceName, from: 'now-15m' });

      I.amOnPage(url);
      dashboardPage.waitForDashboardOpened();
      await dashboardPage.expandEachDashboardRow();
      I.click(adminPage.fields.metricTitle);
      adminPage.performPageDown(5);
      dashboardPage.verifyMetricsExistence(dashboardPage.mySQLInstanceOverview.metrics);
      await dashboardPage.verifyThereAreNoGraphsWithNA(1);
      await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
    }
  },
);

Scenario(
  'PMM-T318 - Open the MySQL Instances Compare dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, adminPage, dashboardPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.mysqlInstancesCompareDashboard.clearUrl, { from: 'now-5m' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.mysqlInstancesCompareDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA(1);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
  },
);

Data(urlsAndMetrics).Scenario(
  'PMM-T1070 + PMM-T449 - Verify link to instructions for enabling rendering images @nightly @dashboards',
  async ({
    I, dashboardPage, links, current,
  }) => {
    I.amOnPage(current.startUrl);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.openGraphDropdownMenu(current.metricName);
    const shareLocator = locate('.dropdown-item-text').withText('Share');

    I.waitForVisible(shareLocator, 20);
    I.click(shareLocator);
    I.waitForVisible(dashboardPage.sharePanel.elements.imageRendererPluginLink, 20);
    I.seeAttributesOnElements(
      dashboardPage.sharePanel.elements.imageRendererPluginLink,
      {
        href: links.imageRendererPlugin,
        target: '_blank',
      },
    );
    I.seeTextEquals('Grafana image renderer plugin', dashboardPage.sharePanel.elements.imageRendererPluginLink);
    let textPlugin = await I.grabTextFrom(dashboardPage.sharePanel.elements.imageRendererPluginInfoText);

    textPlugin = textPlugin.replace(/\u00a0/g, ' ');
    assert.ok(
      textPlugin.includes(dashboardPage.sharePanel.messages.imageRendererPlugin),
      `Expected the share panel text: ${textPlugin} to include ${dashboardPage.sharePanel.messages.imageRendererPlugin}`,
    );
  },
);

Scenario(
  'PMM-T68 - Open the ProxySQL Instance Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.proxysqlInstanceSummaryDashboard.url, { from: 'now-5m' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.proxysqlInstanceSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(16);
  },
);

Scenario(
  'PMM-T67 - Open the PXCGalera Cluster Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, adminPage, dashboardPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.pxcGaleraClusterSummaryDashboard.url, { from: 'now-5m' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.pxcGaleraClusterSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(2);
  },
);

Scenario(
  'PMM-T1743 - verify PXCGalera Cluster Summary Dashboard (Experimental) metrics @nightly @dashboards',
  async ({ I, adminPage, dashboardPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.pxcGaleraClusterSummaryExperimentalDashboard.url, { from: 'now-5m' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.pxcGaleraClusterSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(2);
  },
);

Scenario(
  'PMM-T324 - Verify MySQL - MySQL User Details dashboard @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    const ps_service_response = await inventoryAPI.apiGetNodeInfoForAllNodesByServiceName('MYSQL_SERVICE', 'ps_8.0');
    const url = I.buildUrlWithParams(dashboardPage.mysqlUserDetailsDashboard.clearUrl, { service_name: ps_service_response[0].service_name, from: 'now-5m' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    adminPage.performPageDown(5);
    await dashboardPage.expandEachDashboardRow();
    adminPage.performPageUp(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.mysqlUserDetailsDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);

// Need to Skip due to wait issue on locator
xScenario(
  'PMM-T396 - Verify that parameters are passed from MySQL User Details dashboard to QAN @nightly @dashboards',
  async ({
    I, dashboardPage, qanFilters, adminPage,
  }) => {
    const filters = ['ps_8.0', 'root'];
    const timeRange = 'Last 12 hours';

    const url = I.buildUrlWithParams(dashboardPage.mysqlUserDetailsDashboard.clearUrl, { service_name: 'ps_8.0', from: 'now-12h' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    I.waitForVisible(dashboardPage.fields.rootUser, 20);
    I.click(dashboardPage.fields.rootUser);
    I.waitForVisible(dashboardPage.fields.dataLinkForRoot);
    I.click(dashboardPage.fields.dataLinkForRoot);
    await dashboardPage.waitAndSwitchTabs(2);
    I.waitForVisible(qanFilters.buttons.showSelected, 60);
    I.waitInUrl('&var-username=root', 30);
    I.waitInUrl('from=now-12h&to=now', 30);
    I.waitForVisible(qanFilters.buttons.showSelected, 60);
    await qanFilters.verifySelectedFilters(filters);
    const timeRangeGrabbed = await dashboardPage.getTimeRange();

    assert.equal(
      timeRangeGrabbed.slice(0, timeRangeGrabbed.length - 1),
      timeRange,
      `Grabbed time range: ${timeRangeGrabbed.slice(
        0,
        timeRangeGrabbed.length - 1,
      )} is not equal to expected time Range: ${timeRange}`,
    );
  },
);

Scenario(
  'PMM-T348 - PXC/Galera Node Summary dashboard @dashboards @nightly',
  async ({ I, dashboardPage, adminPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.mysqlPXCGaleraNodeSummaryDashboard.clearUrl, { from: 'now-15m' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Service Name', 'pxc_node');
    adminPage.performPageDown(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.mysqlPXCGaleraNodeSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(2);
  },
);

Scenario(
  'PMM-T349 - PXC/Galera Nodes Compare dashboard @dashboards @nightly',
  async ({ I, dashboardPage, adminPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.mysqlPXCGaleraNodesCompareDashboard.clearUrl, { from: 'now-15m' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Service Name', 'pxc');
    await dashboardPage.expandEachDashboardRow();
    dashboardPage.verifyMetricsExistence(dashboardPage.mysqlPXCGaleraNodesCompareDashboard.metrics);
    dashboardPage.verifyTabExistence(dashboardPage.mysqlPXCGaleraNodesCompareDashboard.tabs);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
  },
);

Scenario(
  'PMM-T430 - Verify metrics on MySQL Group Replication Summary Dashboard @dashboards @nightly',
  async ({ I, dashboardPage, adminPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.groupReplicationDashboard.clearUrl, { from: 'now-1h' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    adminPage.performPageDown(5);
    await dashboardPage.expandEachDashboardRow();
    adminPage.performPageUp(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.groupReplicationDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
  },
);
