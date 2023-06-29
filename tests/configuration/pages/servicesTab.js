const { I } = inject();
const paginationPart = require('./paginationFragment');

const getServiceRowLocator = (serviceName) => `//span[contains(text(), '${serviceName}')]//ancestor::tr`;

/**
 * All elements and methods for the PMM Inventory / Services Page
 */
module.exports = {
  url: 'graph/inventory/services',
  fields: {
    nodesLink: locate('[role="tablist"] a').withText('Nodes').withAttr({ 'aria-label': 'Tab Nodes' }),
    serviceRow: (serviceName) => getServiceRowLocator(serviceName),
    serviceCellMonitoring: (serviceName) => `${getServiceRowLocator(serviceName)}/td[5]`,
    inventoryTable: locate('table'),

  },
  pagination: paginationPart,

  async open() {
    I.amOnPage(this.url);
    await I.waitForVisible(this.fields.nodesLink, 30);
  },

  async getServiceMonitoringStatus(serviceName) {
    await I.waitForVisible(this.fields.serviceRow(serviceName), 60);

    return (await I.grabTextFrom(this.fields.serviceCellMonitoring(serviceName))).trim();
  },
};
