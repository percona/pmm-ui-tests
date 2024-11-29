Feature('Verify Prometheus Overview Dashboard');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1943 Verify CPU and Memory Usage for each agents on Prometheus Overview status dashboard @nightly',
  async ({ I, dashboardPage, inventoryAPI }) => {
    const errorValues = [];
    const graphs = [{ id: '1915', name: 'CPU Cores Used', limitValue: 0.5 }, { id: '2216', name: 'Memory Usage', limitValue: 200 }];
    const { services } = (await inventoryAPI.getServices()).data;

    for (const graph of graphs) {
      for (const service of services) {
        console.log(`Testing for service: ${service.service_type}`);

        I.amOnPage(I.buildUrlWithParams(dashboardPage.prometheusExporterOverviewDashboard.cleanUrl, {
          node_name: services[0].node_name,
          from: 'now-1h',
        }));
        dashboardPage.waitForDashboardOpened();

        const graphValues = await dashboardPage.prometheusExporterOverviewDashboard
          .getGraphValues(graph.id, services[0].service_type, services[0].node_name, 10);

        console.log(graphValues);

        for (const [name, values] of Object.entries(graphValues)) {
          values.forEach((value) => {
            if (parseFloat(value) > graph.limitValue) {
              errorValues.push({ graphName: graph.name, exporterName: name, value });
            }
          });
        }
      }
    }

    if (errorValues.length) {
      throw new Error(`Values in graphs above threshold. Error values are: ${JSON.stringify(errorValues)}`);
    }
  },
)//.retry(2);
