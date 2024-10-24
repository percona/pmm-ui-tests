Feature('Verify Prometheus Overview Dashboard');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1943 Verify CPU and Memory Usage for each agents on Prometheus Overview status dashboard @nightly',
  async ({ I, dashboardPage, inventoryAPI }) => {
    const { services } = (await inventoryAPI.getServices()).data;

    // for (const service of services) {
    // console.log(service.node_name);
    // console.log(service.service_type);
    console.log(`Testing for service: ${services[0].node_name}`);
    I.amOnPage(I.buildUrlWithParams(dashboardPage.prometheusExporterOverviewDashboard.cleanUrl, { node_name: services[0].node_name, from: 'now-1h' }));
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.prometheusExporterOverviewDashboard.getGraphValues('CPU Cores Used', services[0].service_type, services[0].node_name, 10);
    // }

    I.saveScreenshot('PMM-T1943.png');
  },
);
