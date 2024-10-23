const { I } = inject();

class PrometheusExporterOverviewDashboard {
  constructor() {
    this.url = 'graph/d/prometheus-overview/prometheus-exporters-overview?orgId=1&refresh=1m&from=now-5m&to=now';
    this.cleanUrl = 'graph/d/prometheus-overview/prometheus-exporters-overview';
    this.elements = {
      graphBody: (graphName) => locate(`//*[@data-testid="data-testid Panel header ${graphName}"]//*[@class="u-over"]`),
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

  async getGraphValues(graphName, numberOfPoints = 10) {
    I.usePlaywrightTo('Get Graph Values', async ({ page }) => {
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
      }
    });
  }
}

module.exports = new PrometheusExporterOverviewDashboard();
module.exports.PrometheusExporterOverviewDashboard = PrometheusExporterOverviewDashboard;
