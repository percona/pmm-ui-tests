const { I } = inject();

class PrometheusExporterOverviewDashboard {
  constructor() {
    this.url = 'graph/d/prometheus-overview/prometheus-exporters-overview?orgId=1&refresh=1m&from=now-5m&to=now';
    this.cleanUrl = 'graph/d/prometheus-overview/prometheus-exporters-overview';
    this.elements = {
      graphBody: (graphName) => locate(`//*[@data-testid="data-testid Panel header ${graphName}"]//*[@class="u-over"]`),
      graphValue: (rowName) => `//*[@id="grafana-portal-container"]//*[text()="${rowName}"]//parent::*//following-sibling::*//div`
    };
    this.metrics = [
      'Avg CPU Usage per Node',
      'Avg Memory Usage per Node',
      'Monitored Nodes',
      'Exporters Running',
      'CPU Usage',
      'Memory Usage',
      'CPU Cores Used',
      'CPU Used',
      'Mem Used',
      'Virtual CPUs',
      'RAM',
      'File Descriptors Used',
    ];
  }

  getExportersForNodeType(serviceType, nodeName) {
    switch (serviceType) {
      case 'mysql':
        return { mysqld_exporter: [], node_exporter: [], vmagent: [] };
      case 'postgresql':
        if (nodeName === 'pmm-server') {
          return { postgres_exporter: [], node_exporter: [] };
        }

        return { postgres_exporter: [], node_exporter: [], vmagent: [] };
      case 'mongodb':
        return { mongodb_exporter: [], node_exporter: [], vmagent: [] };
      default:
        throw new Error(`Node type: "${serviceType}" is not supported`);
    }
  }

  async getGraphValues(graphName, serviceType, nodeName, numberOfPoints = 10) {
    const exporters = this.getExportersForNodeType(serviceType, nodeName);

    I.usePlaywrightTo('Get Graph Values', async ({ page }) => {
      console.log(`Exporters for node type ${serviceType} are: ${JSON.stringify(exporters)}`);
      const boundingBox = await page.locator(this.elements.graphBody(graphName).value).boundingBox();
      const widthItterations = boundingBox.width / numberOfPoints;

      await page.locator(this.elements.graphBody(graphName).value).waitFor({ state: 'visible' });

      for (let i = 0; i <= numberOfPoints; i++) {
        let x;

        if (i === 0) {
          x = 1;
        } else if (i * widthItterations >= boundingBox.width) {
          x = boundingBox.width - 1;
        } else {
          x = i * widthItterations;
        }

        await page.locator(this.elements.graphBody(graphName).value).hover({
          position: { x, y: boundingBox.height / 2 },
        });
        for (const [exporter, value] of Object.entries(exporters)) {
          exporters[exporter].push(await page.locator(this.elements.graphValue(exporter)).textContent());
          // console.log(`Exporter is ${exporter}`);
          // console.log(`Value for exporter ${exporter} is: ${await page.locator(this.elements.graphValue(exporter)).textContent()}`);
        }
      }
      console.log(exporters);
    });
  }
}

module.exports = new PrometheusExporterOverviewDashboard();
module.exports.PrometheusExporterOverviewDashboard = PrometheusExporterOverviewDashboard;
