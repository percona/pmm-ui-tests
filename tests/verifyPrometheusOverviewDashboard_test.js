Feature('Verify Prometheus Overview Dashboard');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1943 Verify CPU and Memory Usage for each agents on Prometheus Overview status dashboard @nightly',
  async ({ I, dashboardPage, inventoryAPI }) => {
    const errorValues = [];
    const graphs = [
      {
        id: '1915',
        name: 'CPU Cores Used',
        limitValues: {
          node_exporter: 0.5,
          postgres_exporter: 0.5,
          vmagent: 0.5,
          'external-exporter': 0.5,
          mysqld_exporter: 0.5,
          mongodb_exporter: 0.5,
          proxysql_exporter: 0.5,
        },
      },
      {
        id: '2216',
        name: 'Memory Usage',
        limitValues: {
          node_exporter: 31457280,
          postgres_exporter: 52428800,
          vmagent: 104857600,
          'external-exporter': 52428800,
          mysqld_exporter: 52428800,
          mongodb_exporter: 52428800,
          proxysql_exporter: 52428800,
        },
      },
    ];

    const nodes = await inventoryAPI.getAllNodes();

    for (const node of nodes) {
      I.amOnPage(I.buildUrlWithParams(dashboardPage.prometheusExporterOverviewDashboard.cleanUrl, {
        node_name: node.node_name,
        from: 'now-1h',
      }));

      for (const graph of graphs) {
        dashboardPage.waitForDashboardOpened();

        const graphValues = await dashboardPage.prometheusExporterOverviewDashboard
          .getGraphValues(graph.id, node.node_name, 10);

        for (const graphValue of graphValues) {
          I.say(`Verifying for service: ${node.node_name} with exporter ${graphValue.name} values: ${graphValue.values}`);
          graphValue.values.forEach((value) => {
            let parsedValue;

            if (graph.name !== 'CPU Cores Used') {
              parsedValue = dashboardPage.convertBytes(value);
            } else {
              parsedValue = parseFloat(value);
            }

            if (
              parsedValue > graph.limitValues[graphValue.name]
              && errorValues.findIndex((value) => value.graphName === graph.name && value.nodeName === node.node_name) === -1
            ) {
              errorValues.push({
                graphName: graph.name,
                nodeName: node.node_name,
                exporterName: graphValue.name,
                value,
              });
            }
          });
        }
      }
    }

    if (errorValues.length) {
      throw new Error(`Values in graphs above threshold. Error values are: ${JSON.stringify(errorValues)}`);
    }
  },
);// .retry(2);
