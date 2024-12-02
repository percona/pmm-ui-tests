const { I } = inject();

class PrometheusExporterOverviewDashboard {
  constructor() {
    this.url = 'graph/d/prometheus-overview/prometheus-exporters-overview?orgId=1&refresh=1m&from=now-5m&to=now';
    this.cleanUrl = 'graph/d/prometheus-overview/prometheus-exporters-overview';
    this.elements = {
      graphBody: (graphName) => locate(`//*[@data-testid="data-testid Panel header ${graphName}"]//*[@class="u-over"]`),
      graphBodyByPanelId: (graphId) => locate(`//*[@data-panelid="${graphId}"]//*[@class="u-over"]`),
      graphItemsByPanelId: (graphId) => locate(`//*[@data-panelid="${graphId}"]//tbody//button`),
      graphValue: (rowName) => `//*[@id="grafana-portal-container"]//*[text()="${rowName}"]//parent::*//following-sibling::*//div`,
      graphPopover: '//*[@id="grafana-portal-container"]/div',
      label: '//label[text()="PMM Annotations"]',
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

  async getGraphValues(graphId, nodeName, numberOfPoints = 10) {
    const exporters = [];

    return await I.usePlaywrightTo('Get Graph Values', async ({ page }) => {
      const boundingBox = await page.locator(this.elements.graphBodyByPanelId(graphId).value).boundingBox();

      for (let i = 0; i < await page.locator(this.elements.graphItemsByPanelId(graphId).value).count(); i++) {
        exporters.push({
          name: (await page.locator(this.elements.graphItemsByPanelId(graphId).value).nth(i).textContent()).trim(),
          values: [],
        });
      }

      const widthItterations = boundingBox.width / numberOfPoints;

      await page.locator(this.elements.graphBodyByPanelId(graphId).value).waitFor({ state: 'visible' });

      for (let i = 0; i <= numberOfPoints; i++) {
        let x;

        if (i === 0) {
          x = 1;
        } else if (i * widthItterations >= boundingBox.width) {
          x = boundingBox.width - 1;
        } else {
          x = i * widthItterations;
        }

        let retries = 0;

        while (!(await page.locator(this.elements.graphPopover).isVisible())) {
          await page.locator(this.elements.label).hover();
          await page.locator(this.elements.graphBodyByPanelId(graphId).value).hover({
            position: { x, y: boundingBox.height / 2 },
          });
          await page.waitForTimeout(200);

          // eslint-disable-next-line no-plusplus
          if (++retries >= 100) throw new Error(`Displaying pop over for graph was not successful for point number ${i} for  node: ${nodeName}`);
        }

        for (const exporter of exporters) {
          await page.locator(this.elements.graphValue(exporter.name)).waitFor({ state: 'visible' });

          exporters.find((temp_exporter) => temp_exporter.name === exporter.name)
            .values
            .push(await page.locator(this.elements.graphValue(exporter.name)).textContent());
        }

        await page.locator(this.elements.label).hover();
      }

      return exporters;
    });
  }
}

module.exports = new PrometheusExporterOverviewDashboard();
module.exports.PrometheusExporterOverviewDashboard = PrometheusExporterOverviewDashboard;
