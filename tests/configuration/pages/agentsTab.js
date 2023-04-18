const { I } = inject();
const paginationPart = require('./paginationFragment');

/**
 * All elements and methods for the PMM Inventory / Agents Page
 */
module.exports = {
  url: 'graph/inventory/agents',
  fields: {
    agentsLink: locate('[role="tablist"] a').withText('Agents').withAttr({ 'aria-label': 'Tab Agents' }),
    nodesLink: locate('[role="tablist"] a').withText('Nodes').withAttr({ 'aria-label': 'Tab Nodes' }),
    inventoryTable: locate('table'),
    pmmAgentLocator: locate('td').withText('PMM Agent'),
  },
  pagination: paginationPart,

  async open() {
    I.amOnPage(this.url);
    I.waitForVisible(this.fields.nodesLink, 30);
    await I.waitForVisible(this.fields.agentsLink, 2);
  },

  /**
   * Check "Other Details" cell for specified agent by Service ID on the Agents page
   *
   * @param   detailsSection  target attribute to check
   * @param   expectedResult  attribute and value to expect in the cell
   * @param   serviceName     Service Name to have a readable logs and error message
   * @param   serviceId       Service ID to search agent details for
   * @return  {Promise<void>} fails test if check fails.
   */
  async verifyAgentOtherDetailsSection(detailsSection, expectedResult, serviceName, serviceId) {
    const locator = locate('span').withText(detailsSection).after(locate('span').withText(`service_id: ${serviceId}`));
    const details = await I.grabTextFrom(locator);

    I.assertEqual(expectedResult, details, `Infomation '${expectedResult}' for service '${serviceName}' is missing!`);
  },
};
