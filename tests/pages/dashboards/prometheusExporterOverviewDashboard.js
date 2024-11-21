const { I } = inject();

class PrometheusExporterOverviewDashboard {
  constructor() {
    this.url = 'graph/d/prometheus-overview/prometheus-exporters-overview?orgId=1&refresh=1m&from=now-5m&to=now';
    this.cleanUrl = 'graph/d/prometheus-overview/prometheus-exporters-overview';
    this.elements = {
      graphBody: (graphName) => locate(`//*[@data-testid="data-testid Panel header ${graphName}"]//*[@class="u-over"]`),
      graphBodyByPanelId: (graphId) => locate(`//*[@data-panelid="${graphId}"]//*[@class="u-over"]`),
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
      case 'haproxy':
        return { node_exporter: [], vmagent: [] };
      case 'proxysql':
        return {
          mysqld_exporter: [],
          node_exporter: [],
          vmagent: [],
          proxysql_exporter: [],
        };
      default:
        throw new Error(`Node type: "${serviceType}" is not supported`);
    }
  }

  async getGraphValues(graphId, serviceType, nodeName, numberOfPoints = 10) {
    const exporters = this.getExportersForNodeType(serviceType, nodeName);

    return await I.usePlaywrightTo('Get Graph Values', async ({ page }) => {
      console.log(`Exporters for node type ${serviceType} are: ${JSON.stringify(exporters)}`);
      const boundingBox = await page.locator(this.elements.graphBodyByPanelId(graphId).value).boundingBox();
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

        for (const [exporter, value] of Object.entries(exporters)) {
          await page.locator(this.elements.graphValue(exporter)).waitFor({ state: 'visible' });
          exporters[exporter].push(await page.locator(this.elements.graphValue(exporter)).textContent());
        }

        await page.locator(this.elements.label).hover();
      }

      return exporters;
    });
  }
}

module.exports = new PrometheusExporterOverviewDashboard();
module.exports.PrometheusExporterOverviewDashboard = PrometheusExporterOverviewDashboard;
