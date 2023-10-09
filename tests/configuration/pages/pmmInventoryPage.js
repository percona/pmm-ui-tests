const { I, inventoryAPI } = inject();
const assert = require('assert');
const paginationPart = require('./paginationFragment');
const servicesTab = require('./servicesTab');

module.exports = {
  url: 'graph/inventory?orgId=1',
  fields: {
    servicesLink: locate('[role="tablist"] a').withText('Services').withAttr({ 'aria-label': 'Tab Services' }),
    serviceRow: (serviceName) => locate('tr').withChild(locate('td').withAttr({ title: serviceName })),
    showServiceDetails: (serviceName) => `//span[contains(text(), '${serviceName}')]//ancestor::tr//button[@data-testid="show-row-details"]`,
    hideServiceDetails: (serviceName) => `//span[contains(text(), '${serviceName}')]//ancestor::tr//button[@data-testid="hide-row-details"]`,
    showAgentDetails: (agentName) => `//span[contains(text(), '${agentName}')]//ancestor::tr//button[@data-testid="show-row-details"]`,
    showRowDetails: '//button[@data-testid="show-row-details"]',
    agentStatus: locate('$details-row-content').find('a'),
    backToServices: '//span[text()="Go back to services"]',
    agentsLinkNew: '//div[contains(@data-testid,"status-badge")]',
    agentDetailsLabelByText: (label) => locate('[aria-label="Tags"]').find('li').withText(label),
    agentsLink: locate('[role="tablist"] a').withText('Agents').withAttr({ 'aria-label': 'Tab Agents' }),
    agentsLink: locate('[role="tablist"] a').withText('Agents').withAttr({ 'aria-label': 'Tab Agents' }),
    agentsLinkOld: locate('a').withText('Agents'),
    deleteButton: locate('span').withText('Delete'),
    externalExporter: locate('td').withText('External exporter'),
    serviceForceModeCheckbox: locate('input').withAttr({'data-testid': 'delete-services-force-mode'}),
    //nodeForceModeCheckbox: locate('input').withAttr({'data-testid': 'force-checkbox-input'}),
    nodeForceModeCheckbox: `//label[@for='input-force-id']//span`,
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
    serviceProceedButton: locate('button').find('span').withText('Yes, delete service'),
    nodeProceedButton: locate('button').find('span').withText('Proceed'),
    runningStatus: locate('span').withText('RUNNING'),
    rowsPerPage: locate('$pagination').find('div'),
    serviceIdLocatorPrefix: '//table//tr/td[4][contains(text(),"',
    tableCheckbox: locate('$select-row').find('span'),
    // cannot be changed to locate() because of method: getCellValue()
    tableRow: '//tr[@data-testid="table-tbody-tr"]',
    processExecPathExporters: '//td[contains(text(), "exporter")]//ancestor::tr[@data-testid="table-row"]//span[contains(text(), "process_exec_path")]',
    nodeExporterStatus: '//td[contains(text(), "Node exporter")]//ancestor::tr[@data-testid="table-row"]//span[contains(text(), "status")]',
    agentId: '//td[contains(text(), "agent_id") and not(following-sibling::td[text()="PMM Agent"])]',
    selectAllCheckbox: locate('$select-all'),
    selectRowCheckbox: locate('$select-row'),
    removalServiceDialogMessage: locate('p').withAttr({'data-testid':'delete-services-description'}),
    removalDialogMessage: locate('form').find('h4'),
    selectedCheckbox: '//div[descendant::input[@value="true"] and @data-testid="select-row"]',
  },
  servicesTab,
  pagination: paginationPart,

  async open() {
    I.amOnPage(this.url);
    await I.waitForVisible(this.fields.nodesLink, 30);
  },

  async openServices() {
    await I.waitForVisible(this.fields.pmmServicesSelector, 20);
    I.click(this.fields.pmmServicesSelector);
    await this.changeRowsPerPage(100);
    I.waitForElement(this.fields.inventoryTable, 60);
    I.scrollPageToBottom();
  },

  openAgents(serviceId) {
    I.amOnPage(`graph/inventory/services/${serviceId.split('/')[2]}/agents`);
    this.changeRowsPerPage(100);
  },

  changeRowsPerPage(count) {
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
    this.openAgents(serviceId);
    // I.waitForElement(this.fields.pmmAgentLocator, 60);
    await this.changeRowsPerPage(100);
    I.waitForElement(this.fields.inventoryTable, 60);
    I.scrollPageToBottom();

    const runningStatus = '//span[contains(text(), "Running")]';

    const numberOfAgents = await I.grabNumberOfVisibleElements(runningStatus);

    if (service_name.includes('azure')) {
      assert.equal(
        numberOfAgents,
        3,
        ` Service ID must have 3 Agents running, Actual Number of Agents found is ${numberOfAgents} for ${service_name}`,
      );
    } else if (/mysql|mongo|psmdb|postgres|pgsql|rds/gim.test(service_name)) {
      assert.equal(
        numberOfAgents,
        2,
        ` Service ID must have 2 Agents running, Actual Number of Agents found is ${numberOfAgents} for ${service_name}`,
      );
    } else {
      assert.equal(numberOfAgents, 1, ` Service ID must have only 1 Agent running ${serviceId} , Actual Number of Agents found is ${numberOfAgents} for ${service_name}`);
    }

    await I.click(this.fields.backToServices);
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

  async checkAgentOtherDetailsSection(agentType, expectedResult, isDisplayed = true) {
    I.click(this.fields.showAgentDetails(agentType));

    if (isDisplayed) {
      I.waitForVisible(this.fields.agentDetailsLabelByText(expectedResult), 10);
    } else {
      I.dontSeeElement(this.fields.agentDetailsLabelByText(expectedResult));
    }
  },

  async checkAgentsLabel(expectedResult) {
    await I.waitForVisible(this.fields.agentDetailsLabelByText(expectedResult), 10);
  },

  async checkAgentOtherDetailsMissing(detailsSection, serviceId) {
    const locator = locate('span').withText(detailsSection).after(locate('span').withText(`service_id: ${serviceId}`));

    I.dontSeeElement(locator);
  },

  async verifyMetricsFlags(serviceName) {
    const servicesLink = this.fields.pmmServicesSelector;

    I.waitForElement(servicesLink, 20);
    I.click(servicesLink);
    await this.changeRowsPerPage(100);
    // const nodeId = await this.getNodeId(serviceName);

    // await I.click(this.fields.showServiceDetails(serviceName));
    // await I.click(this.fields.agentsLinkNew);
    await this.changeRowsPerPage(100);

    await I.click(this.fields.showServiceDetails(serviceName));
    await I.click(this.fields.agentsLinkNew);
    const rows = await I.grabNumberOfVisibleElements(this.fields.showRowDetails);

    for (let i = 1; i <= rows; i++) {
      await I.click(`(${this.fields.showRowDetails})[1]`);
    }

    const enhanceMetricsDisabled = '//span[contains(text(),"enhanced_metrics_disabled: true")]';

    I.waitForElement(enhanceMetricsDisabled, 30);
    I.seeElement(enhanceMetricsDisabled);
    const basicMetricsDisabled = '//span[contains(text(),"basic_metrics_disabled: true")]';

    I.seeElement(basicMetricsDisabled);
  },

  async getNodeId(serviceName) {
    const nodeIdLocator = `${this.fields.serviceIdLocatorPrefix + serviceName}")]/../td[5]`;

    return await I.grabTextFrom(nodeIdLocator);
  },

  async getServiceId(serviceName) {
    await I.waitForVisible(this.fields.showServiceDetails(serviceName), 60);
    await I.click(this.fields.showServiceDetails(serviceName));
    const serviceIdLocator = '//span[text()="Service ID"]/following-sibling::div//span';

    I.waitForVisible(serviceIdLocator, 30);
    const matchedServices = await I.grabNumberOfVisibleElements(serviceIdLocator);

    await assert.equal(
      matchedServices,
      1,
      `There must be only one entry for the newly added service with name ${serviceName}`,
    );

    const serviceId = await I.grabTextFrom(serviceIdLocator);

    await I.click(this.fields.hideServiceDetails(serviceName));

    return serviceId;
  },

  selectService(serviceName) {
    const serviceLocator = `//span[contains(text(),"${serviceName}")]/preceding::td[2]/div[@data-testid="select-row"]`;
    I.waitForVisible(serviceLocator, 30);
    I.click(serviceLocator);
  },

  selectNode(serviceName) {
    const serviceLocator = `//td[contains(text(),"${serviceName}")]/preceding::td[2]/div[@data-testid="select-row"]`;
    I.waitForVisible(serviceLocator, 30);
    I.click(serviceLocator);
  },

  serviceExists(serviceName, deleted) {
    const serviceLocator = `//span[contains(text(),"${serviceName}")]`;
    if (deleted) {
      I.waitForInvisible(serviceLocator, 30);
    } else {
      I.waitForVisible(serviceLocator, 30);
    }
  },

  checkNodeExists(serviceName) {
    const nodeName = `//td[contains(text(),"${serviceName}")]`;

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
    const serviceIDs = await I.grabTextFrom(serviceIdLocator1);

    console.out(serviceIDs);
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
    //const agentIdLocator = `//table//tr/td[2][contains(text(),"${id}")]/preceding-sibling::td/div[@data-testid="select-row"]`;
    const agentIdLocator = `//span[contains(text(),"${id}")]/preceding::td[2]/div[@data-testid="select-row"]`;
    I.waitForVisible(agentIdLocator, 30);
    I.click(agentIdLocator);
  },

  async deleteServiceWithForceOpt(serviceName) {
    I.click(this.fields.deleteButton);
    I.waitForElement(this.fields.serviceForceModeCheckbox,40);
    await I.click(this.fields.serviceForceModeCheckbox);
    I.click(this.fields.serviceProceedButton);
  },

  async deleteNodeWithForceOpt() {
    I.click(this.fields.deleteButton);
    I.waitForElement(this.fields.nodeForceModeCheckbox,40);
    await I.click(this.fields.nodeForceModeCheckbox);
    I.click(this.fields.nodeProceedButton);
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

  async checkExistingAgent(agent, serviceName) {
    await I.click(this.fields.showServiceDetails(serviceName));
    I.click(this.fields.agentsLinkNew);
    await I.waitForVisible(agent, 30);
    I.click(this.fields.backToServices);
  },
};
