const { I, inventoryAPI } = inject();
const assert = require('assert');
const paginationPart = require('./paginationFragment');
const agentsTab = require('./agentsTab');

module.exports = {
  url: 'graph/inventory?orgId=1',
  fields: {
    showServiceDetails: (serviceName) => `//span[contains(text(), '${serviceName}')]//ancestor::tr//button[@data-testid="show-row-details"]`,
    agentsLinkNew: '//div[contains(@data-testid,"status-badge")]',
    agentsLink: locate('[role="tablist"] a').withText('Agents').withAttr({ 'aria-label': 'Tab Agents' }),
    agentsLinkOld: locate('a').withText('Agents'),
    deleteButton: locate('span').withText('Delete'),
    externalExporter: locate('td').withText('External exporter'),
    forceModeCheckbox: locate('$force-field-label'),
    inventoryTable: locate('table'),
    inventoryTableColumn: locate('table').find('td'),
    inventoryTableRows: locate('tr').after('table'),
    inventoryTableRowCount: (count) => locate('span').withText(`${count}`),
    mongoServiceName: locate('td').withText('mongodb'),
    mysqlServiceName: locate('td').withText('ms-single'),
    // cannot be changed to locate because it's failing in I.waitForVisible()
    nodesLink: locate('[role="tablist"] a').withText('Nodes').withAttr({ 'aria-label': 'Tab Nodes' }),
    nodesLinkOld: locate('a').withText('Nodes'),
    pdphsqlServiceName: locate('td').withText('PGSQL'),
    pmmAgentLocator: locate('td').withText('PMM Agent'),
    pmmServerPostgresLocator: locate('td').withText('pmm-server-postgresql'),
    pmmServicesSelector: locate('[role="tablist"] a').withText('Services').withAttr({ 'aria-label': 'Tab Services' }),
    postgresExporter: locate('td').withText('Postgres exporter'),
    postgresPgStatements: locate('td').withText('QAN PostgreSQL PgStatements'),
    postgresPgstatmonitor: locate('td').withText('QAN PostgreSQL Pgstatmonitor'),
    proceedButton: locate('span').withText('Proceed'),
    runningStatus: locate('span').withText('RUNNING'),
    rowsPerPage: locate('$pagination').find('div'),
    serviceIdLocatorPrefix: '//table//tr/td[4][contains(text(),"',
    tableCheckbox: locate('$select-row').find('span'),
    // cannot be changed to locate() because of method: getCellValue()
    tableRow: '//tr[@data-testid="table-tbody-tr"]',
    processExecPathExporters: '//td[contains(text(), "exporter")]//ancestor::tr[@data-testid="table-row"]//span[contains(text(), "process_exec_path")]',
    nodeExporterStatus: '//td[contains(text(), "Node exporter")]//ancestor::tr[@data-testid="table-row"]//span[contains(text(), "status")]',
    agentId: '//td[contains(text(), "agent_id") and not(following-sibling::td[text()="PMM Agent"])]',
  },
  agentsTab,
  pagination: paginationPart,

  async open() {
    I.amOnPage(this.url);
    I.waitForVisible(this.fields.nodesLink, 30);
    await I.waitForVisible(this.fields.agentsLink, 2);
  },

  async openServices() {
    await I.waitForVisible(this.fields.pmmServicesSelector, 20);
    I.click(this.fields.pmmServicesSelector);
    await this.changeRowsPerPage(100);
    I.waitForElement(this.fields.inventoryTable, 60);
    I.scrollPageToBottom();
  },

  async openAgents() {
    await I.waitForVisible(this.fields.agentsLink, 20);
    I.click(this.fields.agentsLink);
    I.waitForElement(this.fields.pmmAgentLocator, 60);
    await this.changeRowsPerPage(100);
    I.waitForElement(this.fields.inventoryTable, 60);
    I.scrollPageToBottom();
  },

  async changeRowsPerPage(count) {
    I.waitForElement(this.fields.rowsPerPage, 30);
    I.scrollPageToBottom();
    I.click(this.fields.rowsPerPage);
    I.waitForElement(this.fields.inventoryTableRowCount(count), 30);
    // Temp Hack for making 100 in the page count rows
    I.pressKey('ArrowDown');
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    I.wait(2);
  },

  verifyRemoteServiceIsDisplayed(serviceName) {
    I.waitForVisible(this.fields.inventoryTableColumn, 30);
    I.scrollPageToBottom();
    I.see(serviceName, this.fields.inventoryTableColumn);
  },

  async verifyAgentHasStatusRunning(service_name) {
    const serviceId = await this.getServiceId(service_name);

    await inventoryAPI.waitForRunningState(serviceId);
    await I.click(this.fields.showServiceDetails(service_name));
    I.click(this.fields.agentsLinkNew);
    // I.waitForElement(this.fields.pmmAgentLocator, 60);
    await this.changeRowsPerPage(100);
    I.waitForElement(this.fields.inventoryTable, 60);
    I.scrollPageToBottom();

    const runningStatus = '//span[contains(text(), "Running")]';

    const numberOfAgents = await I.grabNumberOfVisibleElements(runningStatus);

    if (/mysql|mongo|psmdb|postgres|pgsql|rds/gim.test(service_name)) {
      await I.waitForVisible(runningStatus, 30);

      assert.equal(
        numberOfAgents,
        2,
        ` Service ID must have 2 Agents running, Actual Number of Agents found is ${numberOfAgents} for ${service_name}`,
      );
    } else {
      assert.equal(numberOfAgents, 3, ` Service ID must have only 3 Agent running ${serviceId} , Actual Number of Agents found is ${numberOfAgents} for ${service_name}`);
    }
  },

  async getServiceIdWithStatus(status) {
    const serviceIds = [];
    const locator = locate('span')
      .withText('service_id:')
      .before(locate('span')
        .withText(`status: ${status}`));

    const strings = await I.grabTextFromAll(locator);

    // we need to cut "service_id: " prefix from grabbed strings
    strings.forEach((item) => serviceIds.push(item.split(': ')[1]));

    return serviceIds;
  },

  async checkAgentOtherDetailsSection(detailsSection, expectedResult, serviceName, serviceId) {
    const locator = locate('span').withText(detailsSection).after(locate('span').withText(`service_id: ${serviceId}`));
    const details = await I.grabTextFrom(locator);

    assert.ok(expectedResult === details, `Infomation '${expectedResult}' for service '${serviceName}' is missing!`);
  },

  async checkAgentOtherDetailsMissing(detailsSection, serviceId) {
    const locator = locate('span').withText(detailsSection).after(locate('span').withText(`service_id: ${serviceId}`));

    I.dontSeeElement(locator);
  },

  async verifyMetricsFlags(serviceName) {
    const servicesLink = this.fields.pmmServicesSelector;
    const agentLinkLocator = this.fields.agentsLink;

    I.waitForElement(servicesLink, 20);
    I.click(servicesLink);
    await this.changeRowsPerPage(100);
    const nodeId = await this.getNodeId(serviceName);

    I.click(agentLinkLocator);
    await this.changeRowsPerPage(100);

    const enhanceMetricsDisabled = `//tr//td//span[contains(text(), "${nodeId}")]/../span[contains(text(),"enhanced_metrics_disabled: true")]`;

    I.waitForElement(enhanceMetricsDisabled, 30);
    I.seeElement(enhanceMetricsDisabled);
    const basicMetricsDisabled = `//tr//td//span[contains(text(), "${nodeId}")]/../span[contains(text(),"basic_metrics_disabled: true")]`;

    I.seeElement(basicMetricsDisabled);
  },

  async getNodeId(serviceName) {
    const nodeIdLocator = `${this.fields.serviceIdLocatorPrefix + serviceName}")]/../td[5]`;

    return await I.grabTextFrom(nodeIdLocator);
  },

  async getServiceId(serviceName) {
    const serviceIdLocator = `${this.fields.serviceIdLocatorPrefix}${serviceName}")]/preceding-sibling::td[2]`;

    I.waitForVisible(serviceIdLocator, 30);
    const matchedServices = await I.grabNumberOfVisibleElements(serviceIdLocator);

    await assert.equal(
      matchedServices,
      1,
      `There must be only one entry for the newly added service with name ${serviceName}`,
    );

    return await I.grabTextFrom(serviceIdLocator);
  },

  selectService(serviceName) {
    const serviceLocator = `${this.fields.serviceIdLocatorPrefix}${serviceName}")]/preceding-sibling::td/div[@data-testid="select-row"]`;

    I.waitForVisible(serviceLocator, 30);
    I.click(serviceLocator);
  },

  serviceExists(serviceName, deleted) {
    const serviceLocator = `${this.fields.serviceIdLocatorPrefix}${serviceName}")]`;

    if (deleted) {
      I.waitForInvisible(serviceLocator, 30);
    } else {
      I.waitForVisible(serviceLocator, 30);
    }
  },

  checkNodeExists(serviceName) {
    const nodeName = `${this.fields.serviceIdLocatorPrefix}${serviceName}")]`;

    I.waitForVisible(nodeName, 20);
  },

  getServicesId(serviceName) {
    return `${this.fields.serviceIdLocatorPrefix}${serviceName}")]/preceding-sibling::td[2]`;
  },

  async getCountOfAgents(serviceId) {
    const countOfAgents = await I.grabNumberOfVisibleElements(serviceId);

    assert.equal(countOfAgents, 0, 'The agents should be removed!');
  },

  async getCountOfRunningAgents() {
    return await I.grabNumberOfVisibleElements(this.fields.runningStatus);
  },

  async getCountOfPMMAgents() {
    return await I.grabNumberOfVisibleElements(this.fields.pmmAgentLocator);
  },

  selectAgent(agentType) {
    const agentLocator = `//table//tr/td[3][contains(text(),"${agentType}")]/preceding-sibling::td/div[@data-testid="select-row"]`;

    I.waitForVisible(agentLocator, 30);
    I.click(agentLocator);
  },

  async getAgentServiceID(agentType) {
    const serviceIdLocator = `//table//tr/td[3][contains(text(),"${agentType}")]/following-sibling::td//span[contains(text(), 'service_id:')]`;

    I.waitForVisible(serviceIdLocator, 30);
    const serviceIDs = await I.grabTextFrom(serviceIdLocator);

    return serviceIDs[0].slice(12, serviceIDs[0].lenght);
  },

  async getAgentID(agentType) {
    const agentIdLocator = `//table//tr/td[3][contains(text(),"${agentType}")]/preceding-sibling::td[1]`;

    I.waitForVisible(agentIdLocator, 30);
    const agentID = await I.grabTextFrom(agentIdLocator);

    return agentID;
  },

  async getNodeCount() {
    I.waitForVisible(this.fields.tableCheckbox);

    return await I.grabNumberOfVisibleElements(this.fields.tableCheckbox);
  },

  verifyNodesCount(before, after) {
    assert.equal(before, after, 'The count of nodes should be same! Check the data!');
  },

  existsByid(id, deleted) {
    const agentIdLocator = `//table//tr/td[2][contains(text(),"${id}")]`;

    if (deleted) {
      I.waitForInvisible(agentIdLocator, 30);
    } else {
      I.waitForVisible(agentIdLocator, 30);
    }
  },

  selectAgentByID(id) {
    const agentIdLocator = `//table//tr/td[2][contains(text(),"${id}")]/preceding-sibling::td/div[@data-testid="select-row"]`;

    I.waitForVisible(agentIdLocator, 30);
    I.click(agentIdLocator);
  },

  deleteWithForceOpt() {
    I.click(this.fields.deleteButton);
    I.click(this.fields.forceModeCheckbox);
    I.click(this.fields.proceedButton);
  },

  async getCountOfItems() {
    return await I.grabNumberOfVisibleElements('$select-row');
  },

  async checkAllNotDeletedAgents(countBefore) {
    const countAfter = await this.getCountOfItems();
    const otherDetails = await I.grabNumberOfVisibleElements(
      '//table//tr/td[4]//span[contains(text(), "pmm-server")]',
    );

    /* we are using count 10 because we have two agents for RDS Instance also,
    hence (pmm-agent, Node exporter, postgres exporter, mysql exporter, QAN RDS,
    QAN postgres, RDS exporter, QAN PostgreSQL PgStatements Agent,
    QAN PostgreSQL PgStatements Agent, QAN MySQL Slowlog Agent)
     */
    // need to be fixed later
    // we need to avoid hardcoded values
    /* assert.ok((otherDetails <= 10 && otherDetails >= 4),
     'Total Agents running on PMM-Server Instance can not be greater then 10'); */
    assert.ok(countBefore > countAfter, `Some PMM Agents should have been deleted, Agents running before deleting ${countBefore} and after deleting ${countAfter}`);
  },

  async getCellValue(rowNumber, columnNumber) {
    const value = await I.grabTextFrom(`${this.fields.tableRow}[${rowNumber}]/td[${columnNumber}]`);

    return value.toLowerCase();
  },

  async checkSort(columnNumber) {
    I.waitForVisible(this.fields.tableRow, 20);
    const rowCount = await I.grabNumberOfVisibleElements(this.fields.tableRow);
    let tmp;

    for (let i = 0; i < rowCount; i++) {
      const cellValue = await this.getCellValue(i + 1, columnNumber);

      if (i === 0) {
        // Do nothing for the first run
        tmp = cellValue;
      } else {
        if (tmp.localeCompare(cellValue) === 1) {
          assert.fail(
            `The array is not sorted correctly from a-z: value ${cellValue} should come after ${tmp}, not before`,
          );
          break;
        }

        // Update the tmp value for the next comparison
        tmp = cellValue;
      }
    }
  },

  checkExistingAgent(agent) {
    I.click(this.fields.agentsLink);
    I.waitForVisible(agent, 30);
  },

  async checkAgentsPresent(expectedAgentIds) {
    const actualAgentIds = (await I.grabTextFromAll(this.fields.agentId))
      .map((string) => string.replace('/agent_id/', ''));

    I.assertNotEqual(expectedAgentIds.length, actualAgentIds.length, `The number of actual Agents doesn't match expected (Expected ${expectedAgentIds.length} but got ${actualAgentIds.length})`);

    expectedAgentIds.forEach((agentId) => {
      I.assertTrue(actualAgentIds.includes(agentId), `Actual Agents don't include expected agent_id (Expected ${agentId} but didn't found)`);
    });
  },
};
