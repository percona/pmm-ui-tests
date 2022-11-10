const {
  I, adminPage, pmmInventoryPage, codeceptjsConfig, remoteInstancesHelper,
} = inject();
const assert = require('assert');

const url = new URL(codeceptjsConfig.config.helpers.Playwright.url);

module.exports = {
  accessKey: remoteInstancesHelper.remote_instance.aws.aws_access_key,
  secretKey: remoteInstancesHelper.remote_instance.aws.aws_secret_key,

  // insert your locators and methods here
  // setting locators
  postgresGCSettings: {
    environment: 'Remote PostgreSQL_GC env',
    cluster: 'Remote PostgreSQL_GC cluster',
  },
  mysqlSettings: {
    environment: 'remote-mysql',
    cluster: 'remote-mysql-cluster',
  },
  potgresqlSettings: {
    environment: 'remote-postgres',
    cluster: 'remote-postgres-cluster',
  },
  postgresqlAzureInputs: {
    userName: remoteInstancesHelper.remote_instance.azure.azure_postgresql.userName,
    password: remoteInstancesHelper.remote_instance.azure.azure_postgresql.password,
    environment: 'Azure PostgreSQL environment',
    cluster: 'Azure PostgreSQL cluster',
    replicationSet: 'Azure PostgreSQL replica',
  },
  mysqlAzureInputs: {
    userName: remoteInstancesHelper.remote_instance.azure.azure_mysql.userName,
    password: remoteInstancesHelper.remote_instance.azure.azure_mysql.password,
    environment: 'Azure MySQL environment',
    cluster: 'Azure MySQL cluster',
    replicationSet: 'Azure MySQL replica',
  },
  mysqlInputs: {
    userName: remoteInstancesHelper.remote_instance.aws.aws_rds_5_6.username,
    password: remoteInstancesHelper.remote_instance.aws.aws_rds_5_6.password,
    environment: 'RDS MySQL 5.6',
    cluster: 'rds56-cluster',
    replicationSet: 'rds56-replication',
  },
  mysql57rdsInput: {
    userName: remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.username,
    password: remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.password,
    environment: 'RDS MySQL 5.7',
    cluster: 'rds57-cluster',
    replicationSet: 'rds57-replication',
  },
  mysql80rdsInput: {
    userName: remoteInstancesHelper.remote_instance.aws.aws_rds_8_0.username,
    password: remoteInstancesHelper.remote_instance.aws.aws_rds_8_0.password,
    environment: 'RDS MySQL 8.0',
    cluster: 'rds80-cluster',
    replicationSet: 'rds80-replication',
  },
  postgresqlInputs: {
    userName: remoteInstancesHelper.remote_instance.aws.aws_postgresql_12.userName,
    password: remoteInstancesHelper.remote_instance.aws.aws_postgresql_12.password,
    environment: 'RDS Postgres',
    cluster: 'rdsPostgres-cluster',
    replicationSet: 'rdsPostgres-replication',
  },
  url: 'graph/add-instance?orgId=1',
  addMySQLRemoteURL: 'graph/add-instance?instance_type=mysql',
  mysql8rds: {
    'Service Name': 'pmm-qa-mysql-8-0-30',
    Environment: 'RDS MySQL 8.0',
    'Replication Set': 'rds80-replication',
    Cluster: 'rds80-cluster',
  },
  mysql57rds: {
    'Service Name': 'pmm-qa-rds-mysql-5-7-39',
    Environment: 'RDS MySQL 5.7',
    'Replication Set': 'rds57-replication',
    Cluster: 'rds57-cluster',
  },
  rds: {
    'Service Name': 'rds-mysql56',
    Environment: 'RDS MySQL 5.6',
    'Replication Set': 'rds56-replication',
    Cluster: 'rds56-cluster',
  },
  elements: {
    noData: '$table-no-data',
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
    database: '$database-text-input',
    disableBasicMetrics: '//input[@id="input-disable_basic_metrics-id"]/following-sibling::*[2]',
    disableEnhancedMetrics: '//input[@id="input-disable_enhanced_metrics-id"]/following-sibling::*[2]',
    discoverBtn: '$credentials-search-button',
    discoveryResults: 'tbody[role="rowgroup"]',
    doNotTrack: locate('label').withText('Don\'t track'),
    environment: '$environment-text-input',
    hostName: '$address-text-input',
    iframe: '//div[@class="panel-content"]//iframe',
    metricsPath: '$metrics_path-text-input',
    noCredentialsError: '//div[text()="No credentials provided and IAM role is not defined"]',
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
    skipConnectionCheck: '//input[@data-testid="skip_connection_check-checkbox-input"]/following-sibling::*[2]',
    skipTLS: '//input[@name="tls_skip_verify"]',
    skipTLSL: locate('$tls_skip_verify-field-container').find('span'),
    startMonitoring: '/following-sibling::td/a',
    subscriptionID: '$azure_subscription_id-text-input',
    tableStatsGroupTableLimit: '$tablestats_group_table_limit-number-input',
    tenantID: '$azure_tenant_id-text-input',
    tlscaInput: '$tls_ca-textarea-input',
    tlsCertificateInput: '$tls_cert-textarea-input',
    tlsCertificateKeyInput: '$tls_key-textarea-input',
    tlsCertificateFilePasswordInput: '$tls_certificate_file_password-password-input',
    tlsCertificateKey: '$tls_certificate_key-textarea-input',
    usePerformanceSchema2: '$qan_mysql_perfschema-field-container',
    usePgStatMonitor: '//label[text()="PG Stat Monitor"]',
    usePgStatStatements: '//label[text()="PG Stat Statements"]',
    useQANMongoDBProfiler: '$qan_mongodb_profiler-field-label',
    useTLS: '$tls-field-label',
    userName: '$username-text-input',
    urlInput: '$url-text-input',
    returnToMenuButton: locate('span').withText('Return to menu'),
    requiredFieldHostname: locate('$address-field-error-message'),
    requiredFieldPort: locate('$port-field-error-message'),
    dontTrackingRadio: locate('label').withAttr({ for: 'radio-btn-1' }).withText('Don\'t track'),
    pgStatStatementsRadio: locate('label').withAttr({ for: 'radio-btn-2' }).withText('PG Stat Statements'),
    pgStatMonitorRadio: locate('label').withAttr({ for: 'radio-btn-3' }).withText('PG Stat Monitor'),
  },

  async getFileContent(filePath) {
    let command;

    if (filePath.includes('mysql')) {
      command = `cat ${filePath} | head -n -1`;
    } else {
      command = `cat ${filePath}`;
    }

    const fileContent = await I.verifyCommand(command);

    return fileContent;
  },

  async fillFileContent(field, file) {
    I.click(field);
    I.type(await this.getFileContent(
      file,
    ));
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
      case 'mysql_ssl':
        I.click(this.fields.addMySqlRemote);
        break;
      case 'mongodb':
      case 'mongodb_ssl':
        I.click(this.fields.addMongoDBRemote);
        break;
      case 'postgresql':
      case 'postgresGC':
      case 'postgres_ssl':
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

  async addRemoteDetails(details, skipUserNamePassword = false) {
    I.waitForElement(this.fields.hostName, 30);
    I.fillField(this.fields.hostName, details.host);
    if (!skipUserNamePassword) {
      I.fillField(this.fields.userName, details.username);
      I.fillField(this.fields.password, details.password);
    }

    adminPage.customClearField(this.fields.portNumber);
    I.fillField(this.fields.portNumber, details.port);
    I.fillField(this.fields.serviceName, details.serviceName);
    I.fillField(this.fields.environment, details.environment);
    I.fillField(this.fields.cluster, details.cluster);

    // eslint-disable-next-line no-empty
    if (details.type === 'postgresql') {
      I.fillField(this.fields.database, details.database);
    }
  },

  async addRemoteSSLDetails(details) {
    if (details.serviceType === 'postgres_ssl' || details.serviceType === 'mysql_ssl') {
      await this.addRemoteDetails(details);
      I.dontSeeElement(this.fields.tlscaInput);
      I.dontSeeElement(this.fields.tlsCertificateKeyInput);
      I.dontSeeElement(this.fields.tlsCertificateInput);
      I.click(this.fields.useTLS);
      I.waitForElement(this.fields.tlscaInput, 30);
      await this.fillFileContent(this.fields.tlscaInput, details.tlsCAFile);
      await this.fillFileContent(this.fields.tlsCertificateInput, details.tlsCertFile);
      await this.fillFileContent(this.fields.tlsCertificateKeyInput, details.tlsKeyFile);
      if (details.serviceType === 'postgres_ssl') I.click(this.fields.usePgStatStatements);

      if (details.serviceType === 'mysql_ssl') I.click(this.fields.skipTLSL);
    }

    if (details.serviceType === 'mongodb_ssl') {
      await this.addRemoteDetails(details, true);
      I.dontSeeElement(this.fields.tlscaInput);
      I.dontSeeElement(this.fields.tlsCertificateFilePasswordInput);
      I.dontSeeElement(this.fields.tlsCertificateKey);
      I.click(this.fields.useTLS);
      I.waitForElement(this.fields.tlscaInput, 30);
      await this.fillFileContent(this.fields.tlscaInput, details.tlsCAFile);
      await this.fillFileContent(this.fields.tlsCertificateKey, details.tlsCertificateKeyFile);
      I.click(this.fields.useQANMongoDBProfiler);
      I.click(this.fields.skipTLSL);
    }
  },

  async fillRemoteFields(serviceName) {
    // eslint-disable-next-line default-case
    switch (serviceName) {
      case remoteInstancesHelper.services.mysql:
        I.fillField(this.fields.hostName, remoteInstancesHelper.remote_instance.mysql.ps_5_7.host);
        I.fillField(this.fields.userName, remoteInstancesHelper.remote_instance.mysql.ps_5_7.username);
        I.fillField(this.fields.password, remoteInstancesHelper.remote_instance.mysql.ps_5_7.password);
        adminPage.customClearField(this.fields.portNumber);
        I.fillField(this.fields.portNumber, remoteInstancesHelper.remote_instance.mysql.ps_5_7.port);
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.environment, this.mysqlSettings.environment);
        I.fillField(this.fields.cluster, this.mysqlSettings.cluster);
        break;
      case remoteInstancesHelper.services.mysql_ssl:
        I.fillField(this.fields.hostName, remoteInstancesHelper.remote_instance.mysql.ms_8_0_ssl.host);
        I.fillField(this.fields.userName, remoteInstancesHelper.remote_instance.mysql.ms_8_0_ssl.username);
        I.fillField(this.fields.password, remoteInstancesHelper.remote_instance.mysql.ms_8_0_ssl.password);
        adminPage.customClearField(this.fields.portNumber);
        I.fillField(this.fields.portNumber, remoteInstancesHelper.remote_instance.mysql.ms_8_0_ssl.port);
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.environment,
          remoteInstancesHelper.remote_instance.mysql.ms_8_0_ssl.environment);
        I.fillField(this.fields.cluster,
          remoteInstancesHelper.remote_instance.mysql.ms_8_0_ssl.clusterName);
        I.dontSeeElement(this.fields.tlscaInput);
        I.dontSeeElement(this.fields.tlsCertificateInput);
        I.dontSeeElement(this.fields.tlsCertificateKeyInput);
        I.click(this.fields.useTLS);
        I.waitForElement(this.fields.tlscaInput, 30);
        await this.fillFileContent(this.fields.tlscaInput,
          remoteInstancesHelper.remote_instance.mysql.ms_8_0_ssl.tlsCAFile);
        await this.fillFileContent(this.fields.tlsCertificateInput,
          remoteInstancesHelper.remote_instance.mysql.ms_8_0_ssl.tlsCertificateFile);
        await this.fillFileContent(this.fields.tlsCertificateKeyInput,
          remoteInstancesHelper.remote_instance.mysql.ms_8_0_ssl.tlsCertificateKeyFile);
        break;
      case remoteInstancesHelper.services.mongodb:
        I.fillField(this.fields.hostName, remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.host);
        I.fillField(this.fields.userName, remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.username);
        I.fillField(this.fields.password, remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.password);
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.environment, 'remote-mongodb');
        I.fillField(this.fields.cluster, 'remote-mongodb-cluster');
        break;
      case remoteInstancesHelper.services.mongodb_ssl:
        I.fillField(this.fields.hostName, remoteInstancesHelper.remote_instance.mongodb.mongodb_4_4_ssl.host);
        adminPage.customClearField(this.fields.portNumber);
        I.fillField(
          this.fields.portNumber,
          remoteInstancesHelper.remote_instance.mongodb.mongodb_4_4_ssl.port,
        );
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.environment,
          remoteInstancesHelper.remote_instance.mongodb.mongodb_4_4_ssl.environment);
        I.fillField(this.fields.cluster,
          remoteInstancesHelper.remote_instance.mongodb.mongodb_4_4_ssl.clusterName);
        I.dontSeeElement(this.fields.tlscaInput);
        I.dontSeeElement(this.fields.tlsCertificateFilePasswordInput);
        I.dontSeeElement(this.fields.tlsCertificateKey);
        I.click(this.fields.useTLS);
        I.waitForElement(this.fields.tlscaInput, 30);
        await this.fillFileContent(this.fields.tlscaInput,
          remoteInstancesHelper.remote_instance.mongodb.mongodb_4_4_ssl.tlsCAFile);
        await this.fillFileContent(this.fields.tlsCertificateFilePasswordInput,
          remoteInstancesHelper.remote_instance.mongodb.mongodb_4_4_ssl.tlsCertificateKeyFilePassword);
        await this.fillFileContent(this.fields.tlsCertificateKey,
          remoteInstancesHelper.remote_instance.mongodb.mongodb_4_4_ssl.tlsCertificateKeyFile);
        break;
      case remoteInstancesHelper.services.postgresql:
        I.fillField(
          this.fields.hostName,
          remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.host,
        );
        I.fillField(
          this.fields.userName,
          remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.username,
        );
        I.fillField(
          this.fields.password,
          remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.password,
        );
        adminPage.customClearField(this.fields.portNumber);
        I.fillField(
          this.fields.portNumber,
          remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.port,
        );
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.environment, this.potgresqlSettings.environment);
        I.fillField(this.fields.cluster, this.potgresqlSettings.cluster);
        break;
      case remoteInstancesHelper.services.postgres_ssl:
        I.fillField(this.fields.hostName,
          remoteInstancesHelper.remote_instance.postgresql.postgres_13_3_ssl.host);
        adminPage.customClearField(this.fields.portNumber);
        I.fillField(this.fields.portNumber,
          remoteInstancesHelper.remote_instance.postgresql.postgres_13_3_ssl.port);
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.environment,
          remoteInstancesHelper.remote_instance.postgresql.postgres_13_3_ssl.environment);
        I.fillField(this.fields.cluster,
          remoteInstancesHelper.remote_instance.postgresql.postgres_13_3_ssl.clusterName);
        I.dontSeeElement(this.fields.tlscaInput);
        I.dontSeeElement(this.fields.tlsCertificateKeyInput);
        I.dontSeeElement(this.fields.tlsCertificateInput);
        I.click(this.fields.useTLS);
        I.waitForElement(this.fields.tlscaInput, 30);
        await this.fillFileContent(this.fields.tlscaInput,
          remoteInstancesHelper.remote_instance.postgresql.postgres_13_3_ssl.tlsCAFile);
        await this.fillFileContent(this.fields.tlsCertificateInput,
          remoteInstancesHelper.remote_instance.postgresql.postgres_13_3_ssl.tlsCertFile);
        await this.fillFileContent(this.fields.tlsCertificateKeyInput,
          remoteInstancesHelper.remote_instance.postgresql.postgres_13_3_ssl.tlsKeyFile);
        break;
      case remoteInstancesHelper.services.proxysql:
        I.fillField(this.fields.hostName, remoteInstancesHelper.remote_instance.proxysql.proxysql_2_1_1.host);
        I.fillField(
          this.fields.userName,
          remoteInstancesHelper.remote_instance.proxysql.proxysql_2_1_1.username,
        );
        I.fillField(
          this.fields.password,
          remoteInstancesHelper.remote_instance.proxysql.proxysql_2_1_1.password,
        );
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.environment, 'remote-proxysql');
        I.fillField(this.fields.cluster, 'remote-proxysql-cluster');
        break;
      case 'external_service_new':
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.hostName, remoteInstancesHelper.remote_instance.external.redis.host);
        I.fillField(this.fields.metricsPath, '/metrics');
        adminPage.customClearField(this.fields.portNumber);
        I.fillField(this.fields.portNumber, remoteInstancesHelper.remote_instance.external.redis.port);
        I.fillField(this.fields.environment, 'remote-external-service');
        I.fillField(this.fields.cluster, 'remote-external-cluster');
        break;
      case 'postgreDoNotTrack':
      case 'postgresPGStatStatements':
      case 'postgresPgStatMonitor':
        I.fillField(
          this.fields.hostName,
          remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.host,
        );
        I.fillField(
          this.fields.userName,
          remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.username,
        );
        I.fillField(
          this.fields.password,
          remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.password,
        );
        adminPage.customClearField(this.fields.portNumber);
        I.fillField(
          this.fields.portNumber,
          remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.port,
        );
        I.fillField(this.fields.serviceName, serviceName);
        break;
      case remoteInstancesHelper.services.postgresGC:
        I.fillField(this.fields.hostName, remoteInstancesHelper.remote_instance.gc.gc_postgresql.address);
        I.fillField(this.fields.userName, remoteInstancesHelper.remote_instance.gc.gc_postgresql.userName);
        I.fillField(this.fields.password, remoteInstancesHelper.remote_instance.gc.gc_postgresql.password);
        I.fillField(this.fields.serviceName, serviceName);
        I.fillField(this.fields.environment, this.postgresGCSettings.environment);
        I.fillField(this.fields.cluster, this.postgresGCSettings.cluster);
    }
    adminPage.performPageDown(1);
  },

  createRemoteInstance(serviceName) {
    I.waitForVisible(this.fields.skipTLSL, 30);
    I.waitForVisible(this.fields.addService, 30);
    I.checkOption(this.fields.skipTLSL);
    // eslint-disable-next-line default-case
    switch (serviceName) {
      case remoteInstancesHelper.services.mongodb:
      case remoteInstancesHelper.services.mongodb_ssl:
        I.click(this.fields.useQANMongoDBProfiler);
        break;
      case remoteInstancesHelper.services.postgresql:
        I.click(this.fields.usePgStatStatements);
        break;
      case 'pmm-qa-pgsql-12':
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
    I.fillField(this.fields.clientID, remoteInstancesHelper.remote_instance.azure.azure_client_id);
    I.fillField(this.fields.clientSecret, remoteInstancesHelper.remote_instance.azure.azure_client_secret);
    I.fillField(this.fields.tenantID, remoteInstancesHelper.remote_instance.azure.azure_tenant_id);
    I.fillField(this.fields.subscriptionID,
      remoteInstancesHelper.remote_instance.azure.azure_subscription_id);
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

  discoverRDSWithoutCredentials() {
    I.waitForVisible(this.elements.noData, 30);
    I.click(this.fields.discoverBtn);
    I.waitForVisible(this.fields.noCredentialsError, 30);
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
      case 'pmm-qa-mysql-8-0-30':
        this.fillFields(this.mysql80rdsInput);
        break;
      case 'pmm-qa-rds-mysql-5-7-39':
        this.fillFields(this.mysql57rdsInput);
        break;
      case 'pmm-qa-pgsql-12':
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
