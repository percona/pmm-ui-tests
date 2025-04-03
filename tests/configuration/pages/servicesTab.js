const { I } = inject();
const paginationPart = require('./paginationFragment');

const getServiceRowLocator = (serviceName) => `//span[contains(text(), '${serviceName}')]//ancestor::tr`;

/**
 * All elements and methods for the PMM Inventory / Services Page
 */
module.exports = {
  url: 'graph/inventory/services',
  fields: {
    serviceRow: (serviceName) => getServiceRowLocator(serviceName),
    serviceCellMonitoring: (serviceName) => `${getServiceRowLocator(serviceName)}/td[5]`,
    inventoryTable: locate('table'),
  },
  buttons: {
    addService: locate('button').withText('Add Service'),
  },
  pagination: paginationPart,

  async open() {
    I.amOnPage(this.url);
    I.waitForVisible(this.buttons.addService, 30);
  },

  async getServiceMonitoringStatus(serviceName) {
    I.waitForVisible(this.fields.serviceRow(serviceName), 60);
    console.log(`Monitoring status is: ${(await I.grabTextFrom(this.fields.serviceCellMonitoring(serviceName))).trim()}`);

    return (await I.grabTextFrom(this.fields.serviceCellMonitoring(serviceName))).trim();
  },
};
