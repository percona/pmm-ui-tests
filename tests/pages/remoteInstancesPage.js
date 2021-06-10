const {
  I, adminPage, pmmInventoryPage, codeceptjsConfig,
} = inject();
const assert = require('assert');

const url = new URL(codeceptjsConfig.config.helpers.Playwright.url);

module.exports = {
  accessKey: process.env.AWS_ACCESS_KEY_ID,
  secretKey: process.env.AWS_SECRET_ACCESS_KEY,

  // insert your locators and methods here
  // setting locators
  mysqlSettings: {
    environment: 'remote-mysql',
    cluster: 'remote-mysql-cluster',
  },
  potgresqlSettings: {
    environment: 'remote-postgres',
    cluster: 'remote-postgres-cluster',
  },
  postgresqlAzureInputs: {
    userName: process.env.AZURE_POSTGRES_USER,
    password: process.env.AZURE_POSTGRES_PASS,
    environment: 'Azure PostgreSQL environment',
    cluster: 'Azure PostgreSQL cluster',
    replicationSet: 'Azure PostgreSQL replica',
  },
  mysqlAzureInputs: {
    userName: process.env.AZURE_MYSQL_USER,
    password: process.env.AZURE_MYSQL_PASS,
    environment: 'Azure MySQL environment',
    cluster: 'Azure MySQL cluster',
    replicationSet: 'Azure MySQL replica',
  },
  mysqlInputs: {
    userName: process.env.REMOTE_AWS_MYSQL_USER,
    password: process.env.REMOTE_AWS_MYSQL_PASSWORD,
    environment: 'RDS MySQL 5.6',
    cluster: 'rds56-cluster',
    replicationSet: 'rds56-replication',
  },
  postgresqlInputs: {
    userName: process.env.REMOTE_AWS_POSTGRES12_USER,
    password: process.env.REMOTE_AWS_POSTGRES12_PASSWORD,
    environment: 'RDS Postgres',
    cluster: 'rdsPostgres-cluster',
    replicationSet: 'rdsPostgres-replication',
  },
  services: {
    mongodb: 'mongodb_remote_new',
    mysql: 'mysql_remote_new',
    postgresql: 'postgresql_remote_new',
    proxysql: 'proxysql_remote_new',
  },
  url: 'graph/add-instance?orgId=1',
  addMySQLRemoteURL: 'graph/add-instance?instance_type=mysql',
  rds: {
    'Service Name': 'rds-mysql56',
    Environment: 'RDS MySQL 5.6',
    'Replication Set': 'rds56-replication',
    Cluster: 'rds56-cluster',
  },
  fields: {
    accessKeyInput: '$aws_access_key-text-input',
    addAWSRDSMySQLbtn: '$rds-instance',
    addAzureMySQLPostgreSQL: '$azure-instance',
    addExternalServiceRemote: '$external-instance',
    addHAProxy: '$haproxy-instance',
    addInstanceDiv: '//div[@class="view"]',
    addInstancesList: '//nav[@class="navigation"]',
    addMongoDBRemote: '$mongodb-instance',
    addMySqlRemote: '$mysql-instance',
    addPostgreSQLRemote: '$postgresql-instance',
    addProxySQLRemote: '$proxysql-instance',
    addService: '#addInstance',
    availabilityZone: '$az-text-input',
    clientID: '$azure_client_id-text-input',
    clientSecret: '$azure_client_secret-password-input',
    cluster: '$cluster-text-input',
    customLabels: '$custom_labels-textarea-input',
    disableBasicMetrics: '//input[@name="disable_basic_metrics"]/following-sibling::span[2]',
    disableEnhancedMetrics: '//input[@name="disable_enhanced_metrics"]/following-sibling::span[2]',
    discoverBtn: '$credentials-search-button',
    discoveryResults: 'tbody[role="rowgroup"]',
    doNotTrack: locate('label').withText('Don\'t track'),
    environment: '$environment-text-input',
    hostName: '$address-text-input',
    iframe: '//div[@class="panel-content"]//iframe',
    metricsPath: '$metrics_path-text-input',
    pageHeaderText: 'PMM Add Instance',
    parseFromURLRadioButton: locate('label').withText('Parse from URL string'),
    password: '$password-password-input',
    portNumber: '$port-text-input',
    region: '$region-text-input',
    remoteInstanceTitle: 'Add instance',
    remoteInstanceTitleLocator: '//section/h3',
    replicationSet: '$replication_set-text-input',
    secretKeyInput: '$aws_secret_key-password-input',
    serviceName: '$serviceName-text-input',
    setManualy: locate('label').withText('Set manually'),
    skipConnectionCheck: '//input[@name="skip_connection_check"]/following-sibling::span[2]',
    skipTLS: '//input[@name="tls_skip_verify"]',
    skipTLSL: '//input[@name="tls_skip_verify"]/following-sibling::span[2]',
    startMonitoring: '/following-sibling::td/a',
    subscriptionID: '$azure_subscription_id-text-input',
    tableStatsGroupTableLimit: '$tablestats_group_table_limit-number-input',
    tenantID: '$azure_tenant_id-text-input',
    usePerformanceSchema2: '//input[@name="qan_mysql_perfschema"]/following-sibling::span[2]',
    usePgStatMonitor: '//label[text()="PG Stat Monitor"]',
    usePgStatStatements: '//label[text()="PG Stat Statements"]',
    useQANMongoDBProfiler: '//input[@name="qan_mongodb_profiler"]',
    useTLS: '$tls-field-label',
    userName: '$username-text-input',
    urlInput: '$url-text-input',
    returnToMenuButton: locate('span').withText('Return to menu'),
    requiredFieldHostname: locate('$address-field-error-message'),
    requiredFieldPort: locate('$port-field-error-message'),
  },

  tableStatsLimitRadioButtonLocator(limit) {
    return locate('label').withText(limit);
  },

  async getTableLimitFieldValue() {
    return await I.grabValueFrom(this.fields.tableStatsGroupTableLimit);
  },

  rdsInstanceIdLocator(instance) {
    return `//tr/td[text()="${instance}"]/following-sibling::td/div/button`;
  },

  waitUntilRemoteInstancesPageLoaded() {
    I.waitForElement(this.fields.addMySqlRemote, 30);
    I.seeElement(this.fields.addMySqlRemote);

    return this;
  },

  openAddRemotePage(instanceType) {
    // eslint-disable-next-line default-case
    switch (instanceType) {
      case 'mysql':
        I.click(this.fields.addMySqlRemote);
        break;
      case 'mongodb':
        I.click(this.fields.addMongoDBRemote);
        break;
      case 'postgresql':
        I.click(this.fields.addPostgreSQLRemote);
        break;
      case 'proxysql':
        I.click(this.fields.addProxySQLRemote);
        break;
      case 'external':
        I.click(this.fields.addExternalServiceRemote);
        break;
      case 'haproxy':
        I.click(this.fields.addHAProxy);
        break;
    }
    I.waitForElement(this.fields.serviceName, 60);

    return this;
  },

  fillRemoteFields(serviceName) {
    // eslint-disable-next-line default-case
    switch (serviceName) {
      case this.services.mysql:
        I.fillField(this.fields.hostName, process.env.REMOTE_MYSQL_HOST);
        I.fillField(this.fields.userName, process.env.REMOTE_MYSQL_USER);
        I.fillField(this.fields.password, process.env.REMOTE_MYSQL_PASSWORD);
        I.appendField(this.fields.portNumber, '');
        I.pressKey(['Shift', 'Home']);
        I.pressKey('Backspace');
        I.fillField(this.fields.portNumber, '3307');
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.environment, this.mysqlSettings.environment);
        I.fillField(this.fields.cluster, this.mysqlSettings.cluster);
        break;
      case this.services.mongodb:
        I.fillField(this.fields.hostName, process.env.REMOTE_MONGODB_HOST);
        I.fillField(this.fields.userName, process.env.REMOTE_MONGODB_USER);
        I.fillField(this.fields.password, process.env.REMOTE_MONGODB_PASSWORD);
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.environment, 'remote-mongodb');
        I.fillField(this.fields.cluster, 'remote-mongodb-cluster');
        break;
      case this.services.postgresql:
        I.fillField(this.fields.hostName, process.env.REMOTE_POSTGRESQL_HOST);
        I.fillField(this.fields.userName, process.env.REMOTE_POSTGRESQL_USER);
        I.fillField(this.fields.password, process.env.REMOTE_POSTGRESSQL_PASSWORD);
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.environment, this.potgresqlSettings.environment);
        I.fillField(this.fields.cluster, this.potgresqlSettings.cluster);
        break;
      case this.services.proxysql:
        I.fillField(this.fields.hostName, process.env.REMOTE_PROXYSQL_HOST);
        I.fillField(this.fields.userName, process.env.REMOTE_PROXYSQL_USER);
        I.fillField(this.fields.password, process.env.REMOTE_PROXYSQL_PASSWORD);
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.environment, 'remote-proxysql');
        I.fillField(this.fields.cluster, 'remote-proxysql-cluster');
        break;
      case 'external_service_new':
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.hostName, url.host);
        I.fillField(this.fields.metricsPath, '/metrics');
        I.fillField(this.fields.portNumber, '42200');
        I.fillField(this.fields.environment, 'remote-external-service');
        I.fillField(this.fields.cluster, 'remote-external-cluster');
        break;
      case 'postgreDoNotTrack':
      case 'postgresPGStatStatements':
      case 'postgresPgStatMonitor':
        I.fillField(this.fields.hostName, process.env.REMOTE_POSTGRESQL_HOST);
        I.fillField(this.fields.userName, process.env.REMOTE_POSTGRESQL_USER);
        I.fillField(this.fields.password, process.env.REMOTE_POSTGRESSQL_PASSWORD);
        I.fillField(this.fields.serviceName, serviceName);
        break;
    }
    adminPage.peformPageDown(1);
  },

  createRemoteInstance(serviceName) {
    I.waitForVisible(this.fields.skipTLSL, 30);
    I.waitForVisible(this.fields.addService, 30);
    I.click(this.fields.skipTLSL);
    // eslint-disable-next-line default-case
    switch (serviceName) {
      case this.services.mongodb:
        I.click(this.fields.useTLS);
        I.click(this.fields.useQANMongoDBProfiler);
        break;
      case this.services.postgresql:
        I.click(this.fields.useTLS);
        I.click(this.fields.usePgStatStatements);
        break;
      case 'rds-mysql56':
      case 'pmm-qa-postgres-12':
        I.click(this.fields.disableEnhancedMetrics);
        I.click(this.fields.disableBasicMetrics);
        break;
    }
    I.click(this.fields.addService);
    I.waitForVisible(pmmInventoryPage.fields.agentsLink, 30);

    return pmmInventoryPage;
  },

  openAddAzure() {
    I.waitForVisible(this.fields.addAzureMySQLPostgreSQL, 10);
    I.click(this.fields.addAzureMySQLPostgreSQL);
    I.waitForVisible(this.fields.clientID, 10);
  },

  discoverAzure() {
    I.fillField(this.fields.clientID, process.env.AZURE_CLIENT_ID);
    I.fillField(this.fields.clientSecret, process.env.AZURE_CLIENT_SECRET);
    I.fillField(this.fields.tenantID, process.env.AZURE_TENNANT_ID);
    I.fillField(this.fields.subscriptionID, process.env.AZURE_SUBSCRIPTION_ID);
    I.click(this.fields.discoverBtn);
    this.waitForDiscovery();
  },

  openAddAWSRDSMySQLPage() {
    I.click(this.fields.addAWSRDSMySQLbtn);
    I.waitForVisible(this.fields.accessKeyInput, 30);
    I.waitForVisible(this.fields.secretKeyInput, 30);
  },

  discoverRDS() {
    I.fillField(this.fields.accessKeyInput, this.accessKey);
    I.fillField(this.fields.secretKeyInput, this.secretKey);
    I.click(this.fields.discoverBtn);
    this.waitForDiscovery();
  },

  waitForDiscovery() {
    I.waitForVisible(this.fields.discoveryResults, 30);
  },

  verifyInstanceIsDiscovered(instanceIdToMonitor) {
    const instanceIdLocator = this.rdsInstanceIdLocator(instanceIdToMonitor);

    I.seeElement(instanceIdLocator);
  },

  startMonitoringOfInstance(instanceIdToMonitor) {
    const instangeIdLocator = this.rdsInstanceIdLocator(instanceIdToMonitor);

    I.waitForVisible(instangeIdLocator, 30);
    I.click(instangeIdLocator);
  },

  verifyAddInstancePageOpened() {
    I.waitForVisible(this.fields.userName, 30);
    I.seeElement(this.fields.userName);
  },

  fillFields(serviceParameters) {
    adminPage.customClearField(this.fields.userName);
    I.fillField(this.fields.userName, serviceParameters.userName);
    I.fillField(this.fields.password, serviceParameters.password);
    I.fillField(this.fields.environment, serviceParameters.environment);
    I.fillField(this.fields.cluster, serviceParameters.cluster);
    I.fillField(this.fields.replicationSet, serviceParameters.replicationSet);
  },

  fillRemoteRDSFields(serviceName) {
    // eslint-disable-next-line default-case
    switch (serviceName) {
      case 'rds-mysql56':
        this.fillFields(this.mysqlInputs);
        break;
      case 'pmm-qa-postgres-12':
        this.fillFields(this.postgresqlInputs);
        break;
      case 'azure-MySQL':
        adminPage.customClearField(this.fields.serviceName);
        I.fillField(this.fields.serviceName, serviceName);
        this.fillFields(this.mysqlAzureInputs);
        break;
      case 'azure-PostgreSQL':
        adminPage.customClearField(this.fields.serviceName);
        I.fillField(this.fields.serviceName, serviceName);
        this.fillFields(this.postgresqlAzureInputs);
    }
    I.scrollPageToBottom();
  },

  parseURL(url) {
    I.waitForVisible(this.fields.parseFromURLRadioButton, 30);
    I.click(this.fields.parseFromURLRadioButton);
    I.waitForVisible(this.fields.urlInput, 30);
    I.fillField(this.fields.urlInput, url);
    I.click(this.fields.setManualy);
  },

  async checkParsing(metricsPath, credentials) {
    const grabbedHostname = await I.grabValueFrom(this.fields.hostName);
    const grabbedMetricPath = await I.grabValueFrom(this.fields.metricsPath);
    const grabbedPort = await I.grabValueFrom(this.fields.portNumber);
    const grabbedCredentials = await I.grabValueFrom(this.fields.userName);
    const protocol = locate('$schema-radio-state');

    assert.ok(grabbedHostname === process.env.MONITORING_HOST, `Hostname is not parsed correctly: ${grabbedHostname}`);
    assert.ok(grabbedMetricPath === metricsPath, `Metrics path is not parsed correctly: ${grabbedMetricPath}`);
    assert.ok(grabbedPort === process.env.EXTERNAL_EXPORTER_PORT, `Port is not parsed correctly: ${grabbedPort}`);
    assert.ok(grabbedCredentials === credentials, `Username is not parsed correctly: ${grabbedCredentials}`);
    assert.ok(grabbedCredentials === credentials, `Password is not parsed correctly: ${grabbedCredentials}`);
    I.seeAttributesOnElements(protocol, { value: 'https' });
  },

  checkRequiredField() {
    I.waitForVisible(this.fields.requiredFieldHostname, 30);
    I.waitForVisible(this.fields.requiredFieldPort, 30);
  },
};
