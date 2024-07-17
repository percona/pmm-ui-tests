const { dashboardPage, homePage } = inject();
const assert = require('assert');
const { SERVICE_TYPE } = require('../helper/constants');

const {
  inventoryAPI,
} = inject();
let services;
const serviceList = [];

const urlsAndMetrics = new DataTable(['metricName', 'startUrl']);

urlsAndMetrics.add(['Client Connections (All Host Groups)', `${dashboardPage.proxysqlInstanceSummaryDashboard.url}?from=now-5m&to=now`]);
urlsAndMetrics.add(['PMM Upgrade', homePage.url]);

Feature('Test Dashboards inside the MySQL Folder');

BeforeSuite(async () => {
  const ps_service_response = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MYSQL, 'ps-');
  const pxc_service_response = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MYSQL, 'pxc_');

  serviceList.push(ps_service_response.service_name);
  serviceList.push(pxc_service_response.service_name);
});

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T317 - Open the MySQL Instance Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    await I.say(serviceList);
    for (const serviceName of serviceList) {
      const url = I.buildUrlWithParams(dashboardPage.mysqlInstanceSummaryDashboard.clearUrl, { service_name: serviceName, from: 'now-15m' });

      I.amOnPage(url);
      dashboardPage.waitForDashboardOpened();
      await dashboardPage.expandEachDashboardRow();
      await dashboardPage.verifyMetricsExistence(dashboardPage.mysqlInstanceSummaryDashboard.metrics);
      // FIXME: 5 N/As once https://jira.percona.com/browse/PMM-10308 is fixed
      await dashboardPage.verifyThereAreNoGraphsWithoutData(6);
    }
  },
);

Scenario(
  'PMM-T319 - Open the MySQL Instances Overview dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    for (const serviceName of serviceList) {
      const url = I.buildUrlWithParams(dashboardPage.mySQLInstanceOverview.clearUrl, { service_name: serviceName, from: 'now-15m' });

      I.amOnPage(url);
      dashboardPage.waitForDashboardOpened();
      await dashboardPage.expandEachDashboardRow();
      await dashboardPage.verifyMetricsExistence(dashboardPage.mySQLInstanceOverview.metrics);
      await dashboardPage.verifyThereAreNoGraphsWithoutData(2);
    }
  },
);

Scenario(
  'PMM-T318 - Open the MySQL Instances Compare dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.mysqlInstancesCompareDashboard.clearUrl, { from: 'now-5m' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.mysqlInstancesCompareDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(6);
  },
);

Data(urlsAndMetrics).Scenario(
  'PMM-T1070 + PMM-T449 - Verify link to instructions for enabling rendering images @nightly @dashboards',
  async ({
    I, dashboardPage, links, current,
  }) => {
    I.amOnPage(current.startUrl);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.panelMenu(current.metricName)
      .showMenu()
      .share();
    I.waitForVisible(dashboardPage.sharePanel.elements.imageRendererPluginLink, 20);
    I.seeAttributesOnElements(
      dashboardPage.sharePanel.elements.imageRendererPluginLink,
      {
        href: links.imageRendererPlugin,
        target: '_blank',
      },
    );
    I.seeTextEquals('Image Renderer plugin', dashboardPage.sharePanel.elements.imageRendererPluginLink);
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
    await dashboardPage.verifyThereAreNoGraphsWithoutData(16);
  },
);

// TODO: https://perconadev.atlassian.net/browse/PMM-12956
Scenario.skip(
  'PMM-T67 - Open the PXCGalera Cluster Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.pxcGaleraClusterSummaryDashboard.url, { from: 'now-5m' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.pxcGaleraClusterSummaryExperimentalDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(2);
  },
);

// TODO: https://perconadev.atlassian.net/browse/PMM-12956
Scenario.skip(
  'PMM-T1743 - verify PXCGalera Cluster Summary Dashboard (Experimental) metrics @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.pxcGaleraClusterSummaryExperimentalDashboard.url, { from: 'now-5m' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.pxcGaleraClusterSummaryExperimentalDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(2);
  },
);

Scenario(
  'PMM-T324 - Verify MySQL - MySQL User Details dashboard @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    const serviceName = serviceList.find((service) => service.includes('ps-'));
    const url = I.buildUrlWithParams(dashboardPage.mysqlUserDetailsDashboard.clearUrl, { service_name: serviceName, from: 'now-5m' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.mysqlUserDetailsDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);

// Need to Skip due to wait issue on locator
xScenario(
  'PMM-T396 - Verify that parameters are passed from MySQL User Details dashboard to QAN @nightly @dashboards',
  async ({ I, dashboardPage, queryAnalyticsPage }) => {
    const serviceName = serviceList.find((service) => service.includes('ps-'));
    const filters = [serviceName, 'root'];
    const timeRange = 'Last 12 hours';

    const url = I.buildUrlWithParams(dashboardPage.mysqlUserDetailsDashboard.clearUrl, { service_name: serviceName, from: 'now-12h' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    I.waitForVisible(dashboardPage.fields.rootUser, 20);
    I.click(dashboardPage.fields.rootUser);
    I.waitForVisible(dashboardPage.fields.dataLinkForRoot);
    I.click(dashboardPage.fields.dataLinkForRoot);
    await dashboardPage.waitAndSwitchTabs(2);
    I.waitForVisible(queryAnalyticsPage.filters.buttons.showSelected, 60);
    I.waitInUrl('&var-username=root', 30);
    I.waitInUrl('from=now-12h&to=now', 30);
    I.waitForVisible(queryAnalyticsPage.filters.buttons.showSelected, 60);
    await queryAnalyticsPage.filters.verifyCheckedFilters(filters);
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
  async ({ I, dashboardPage }) => {
    const serviceName = serviceList.find((service) => service.includes('pxc_node'));
    const url = I.buildUrlWithParams(dashboardPage.mysqlPXCGaleraNodeSummaryDashboard.clearUrl, { from: 'now-15m', service_name: serviceName });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.verifyMetricsExistence(dashboardPage.mysqlPXCGaleraNodeSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(2);
  },
);

Scenario(
  'PMM-T349 - PXC/Galera Nodes Compare dashboard @dashboards @nightly',
  async ({ I, dashboardPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.mysqlPXCGaleraNodesCompareDashboard.clearUrl, { from: 'now-15m', service_name: 'All' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.mysqlPXCGaleraNodesCompareDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
  },
);

Scenario(
  'PMM-T430 - Verify metrics on MySQL Group Replication Summary Dashboard @dashboards @nightly',
  async ({ I, dashboardPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.groupReplicationDashboard.clearUrl, { from: 'now-5m' });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.groupReplicationDashboard.metrics);
    // Change to 3 as accetableNAcount after https://perconadev.atlassian.net/browse/PMM-13121 is fixed.
    await dashboardPage.verifyThereAreNoGraphsWithoutData(8);
  },
);
