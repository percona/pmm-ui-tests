const assert = require('assert');
const faker = require('faker');
const { generate } = require('generate-password');

const {
  adminPage, remoteInstancesHelper, perconaServerDB, pmmSettingsPage, dashboardPage, databaseChecksPage,
} = inject();

const pathToPMMFramework = adminPage.pathToPMMTests;

const sslinstances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric', 'dashboard']);

sslinstances.add(['pgsql_14_ssl_service', '14', 'pgsql_14', 'postgres_ssl', 'pg_stat_database_xact_rollback', dashboardPage.postgresqlInstanceOverviewDashboard.url]);
sslinstances.add(['mysql_8.0_ssl_service', '8.0', 'mysql_8.0', 'mysql_ssl', 'mysql_global_status_max_used_connections', dashboardPage.mySQLInstanceOverview.url]);
sslinstances.add(['mongodb_4.4_ssl_service', '4.4', 'mongodb_4.4', 'mongodb_ssl', 'mongodb_connections', dashboardPage.mongoDbInstanceOverview.url]);

const alertManager = {
  alertmanagerURL: 'http://192.168.0.1:9093',
  alertmanagerRules: pmmSettingsPage.alertManager.rule2,
};

const clientDbServices = new DataTable(['serviceType', 'name', 'metric', 'annotationName', 'dashboard', 'upgrade_service']);

clientDbServices.add(['MYSQL_SERVICE', 'ps_', 'mysql_global_status_max_used_connections', 'annotation-for-mysql', dashboardPage.mysqlInstanceSummaryDashboard.url, 'mysql_upgrade']);
clientDbServices.add(['POSTGRESQL_SERVICE', 'PGSQL_', 'pg_stat_database_xact_rollback', 'annotation-for-postgres', dashboardPage.postgresqlInstanceSummaryDashboard.url, 'pgsql_upgrade']);
clientDbServices.add(['MONGODB_SERVICE', 'mongodb_', 'mongodb_connections', 'annotation-for-mongo', dashboardPage.mongoDbInstanceSummaryDashboard.url, 'mongo_upgrade']);

const connection = perconaServerDB.defaultConnection;
const emptyPasswordSummary = 'User(s) has/have no password defined';
const psServiceName = 'upgrade-stt-ps-5.7.30';
const failedCheckRowLocator = databaseChecksPage.elements
  .failedCheckRowByServiceName(psServiceName);
const ruleName = 'Alert Rule for upgrade';
const failedCheckMessage = 'Newer version of Percona Server for MySQL is available';

// For running on local env set PMM_SERVER_LATEST and DOCKER_VERSION variables
function getVersions() {
  const [, pmmMinor, pmmPatch] = (process.env.PMM_SERVER_LATEST || '').split('.');
  const [, versionMinor, versionPatch] = process.env.DOCKER_VERSION
    ? (process.env.DOCKER_VERSION || '').split('.')
    : (process.env.SERVER_VERSION || '').split('.');

  const majorVersionDiff = pmmMinor - versionMinor;
  const patchVersionDiff = pmmPatch - versionPatch;
  const current = `2.${versionMinor}`;

  return {
    majorVersionDiff,
    patchVersionDiff,
    current,
    versionMinor,
  };
}

const { versionMinor, patchVersionDiff, majorVersionDiff } = getVersions();

const iaReleased = versionMinor >= 13;

Feature('PMM server Upgrade Tests and Executing test cases related to Upgrade Testing Cycle').retry(1);

Before(async ({ I }) => {
  await I.Authorize();
  I.setRequestTimeout(60000);
});

BeforeSuite(async ({ I, codeceptjsConfig }) => {
  if (process.env.AMI_UPGRADE_TESTING_INSTANCE !== 'true') {
    const mysqlComposeConnection = {
      host: (process.env.AMI_UPGRADE_TESTING_INSTANCE === 'true' ? process.env.VM_CLIENT_IP : '127.0.0.1'),
      port: (process.env.AMI_UPGRADE_TESTING_INSTANCE === 'true' ? remoteInstancesHelper.remote_instance.mysql.ps_5_7.port : connection.port),
      username: connection.username,
      password: connection.password,
    };

    perconaServerDB.connectToPS(mysqlComposeConnection);

    // Connect to MongoDB
    const mongoConnection = {
      host: (process.env.AMI_UPGRADE_TESTING_INSTANCE === 'true' ? process.env.VM_CLIENT_IP : codeceptjsConfig.config.helpers.MongoDBHelper.host),
      port: (process.env.AMI_UPGRADE_TESTING_INSTANCE === 'true' ? remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.port : codeceptjsConfig.config.helpers.MongoDBHelper.port),
      username: codeceptjsConfig.config.helpers.MongoDBHelper.username,
      password: codeceptjsConfig.config.helpers.MongoDBHelper.password,
    };

    await I.mongoConnect(mongoConnection);
  }
});

AfterSuite(async ({ I, perconaServerDB }) => {
  await perconaServerDB.disconnectFromPS();
  await I.mongoDisconnect();
});

Scenario(
  'Add AMI Instance ID @ami-upgrade',
  async ({ amiInstanceAPI }) => {
    await amiInstanceAPI.verifyAmazonInstanceId(process.env.AMI_INSTANCE_ID);
  },
);

Scenario(
  'PMM-T289 Verify Whats New link is presented on Update Widget @ami-upgrade @pre-upgrade @pmm-upgrade',
  async ({ I, homePage }) => {
    const locators = homePage.getLocators(versionMinor);

    I.amOnPage(homePage.url);
    // Whats New Link is added for the latest version hours before the release,
    // hence we need to skip checking on that, rest it should be available and checked.
    if (majorVersionDiff >= 1 && patchVersionDiff >= 1) {
      I.waitForElement(locators.whatsNewLink, 30);
      I.seeElement(locators.whatsNewLink);
      const link = await I.grabAttributeFrom(locators.whatsNewLink, 'href');

      assert.equal(link.indexOf('https://per.co.na/pmm/') > -1, true, 'Whats New Link has an unexpected URL');
    }
  },
);
/*
Scenario(
  'PMM-T288 Verify user can see Update widget before upgrade [critical] @pre-upgrade @ami-upgrade @pmm-upgrade',
  async ({ I, homePage }) => {
    I.amOnPage(homePage.url);
    await homePage.verifyPreUpdateWidgetIsPresent(versionMinor);
  },
);

Scenario(
  'PMM-T391 Verify user is able to create and set custom home dashboard @pre-upgrade @ami-upgrade @pmm-upgrade',
  async ({ I, grafanaAPI, dashboardPage }) => {
    const folder = await grafanaAPI.createFolder(grafanaAPI.customFolderName);
    const resp = await grafanaAPI.createCustomDashboard(grafanaAPI.customDashboardName, folder.id);

    await grafanaAPI.starDashboard(resp.id);
    await grafanaAPI.setHomeDashboard(resp.id);

    I.amOnPage('');
    dashboardPage.waitForDashboardOpened();
    // dashboardPage.verifyMetricsExistence(['Custom Panel']);
    I.seeInCurrentUrl(resp.url);
  },
);

Scenario(
  'Verify user is able to set custom Settings like Data_retention, Resolution @pre-upgrade @ami-upgrade @pmm-upgrade',
  async ({ settingsAPI, I }) => {
    const body = {
      telemetry_enabled: true,
      metrics_resolutions: {
        hr: '30s',
        mr: '60s',
        lr: '60s',
      },
      data_retention: '172800s',
    };

    await settingsAPI.changeSettings(body, true);
    I.wait(10);
  },
);

if (versionMinor >= 15) {
  Scenario(
    'Verify user has failed checks before upgrade @pre-upgrade @pmm-upgrade',
    async ({
      I,
      settingsAPI,
      databaseChecksPage,
      securityChecksAPI,
      addInstanceAPI,
    }) => {
      const runChecks = locate('button')
        .withText('Run DB checks');

      await perconaServerDB.dropUser();
      await perconaServerDB.createUser();
      await settingsAPI.changeSettings({ stt: true });
      await addInstanceAPI.addInstanceForSTT(connection, psServiceName);

      await securityChecksAPI.startSecurityChecks();
      // Waiting to have results
      await securityChecksAPI.waitForFailedCheckExistance(emptyPasswordSummary);
      // Run DB Checks from UI
      // disable check, change interval for a check, change interval settings
      if (versionMinor >= 16) {
        await securityChecksAPI.disableCheck('mongodb_version');
        await securityChecksAPI.changeCheckInterval('postgresql_version');
        await settingsAPI.setCheckIntervals({
          ...settingsAPI.defaultCheckIntervals,
          standard_interval: '3600s',
        });
        I.amOnPage(databaseChecksPage.url);
      } else {
        I.amOnPage(databaseChecksPage.oldUrl);
      }

      I.waitForVisible(runChecks, 30);
      I.waitForVisible(failedCheckRowLocator, 60);

      // Check that there are failed checks
      await securityChecksAPI.verifyFailedCheckExists(emptyPasswordSummary);
      await securityChecksAPI.verifyFailedCheckExists(failedCheckMessage);

      // Silence mysql Empty Password failed check
      I.waitForVisible(failedCheckRowLocator, 30);
      I.click(failedCheckRowLocator.find('button').first());
    },
  );

  Scenario(
    'Adding Redis as external Service before Upgrade @pre-upgrade @pmm-upgrade',
    async ({
      I, addInstanceAPI,
    }) => {
      await addInstanceAPI.addExternalService('redis_external_remote');
      await I.verifyCommand(
        'pmm-admin add external --listen-port=42200 --group="redis" --custom-labels="testing=redis" --service-name="redis_external_2"',
      );
    },
  );
}

Scenario(
  'Verify user can create Remote Instances before upgrade @pre-upgrade @ami-upgrade @pmm-upgrade',
  async ({ addInstanceAPI }) => {
    // Adding instances for monitoring
    for (const type of Object.values(remoteInstancesHelper.instanceTypes)) {
      if (type) {
        await addInstanceAPI.apiAddInstance(
          type,
          remoteInstancesHelper.upgradeServiceNames[type.toLowerCase()],
        );
      }
    }
  },
);

if (versionMinor < 16 && versionMinor >= 10) {
  Scenario(
    'PMM-T720 Verify Platform registration for PMM before 2.16.0 @pre-upgrade @ami-upgrade @pmm-upgrade',
    async ({ I }) => {
      const message = 'Please upgrade PMM to v2.16 or higher to use the new Percona Platform registration flow.';
      const body = {
        email: faker.internet.email(),
        password: generate({
          length: 10,
          numbers: true,
          lowercase: true,
          uppercase: true,
          strict: true,
        }),
      };
      const headers = { Authorization: `Basic ${await I.getAuth()}` };

      const resp = await I.sendPostRequest('v1/Platform/SignUp', body, headers);

      assert.ok(
        resp.status === 400 && resp.data.message === message,
        `Expected to see ${message} for Sign Up to the Percona Platform call. Response message is "${resp.data.message}"`,
      );
    },
  );
}

if (iaReleased) {
  Scenario.skip(
    'PMM-T577 Verify user is able to see IA alerts before upgrade @pre-upgrade @ami-upgrade @pmm-upgrade',
    async ({
      settingsAPI, rulesAPI, alertsAPI,
    }) => {
      await settingsAPI.changeSettings({ alerting: true });
      await rulesAPI.clearAllRules(true);
      await rulesAPI.createAlertRule({ ruleName });
      // Wait for alert to appear
      await alertsAPI.waitForAlerts(60, 1);
    },
  );
}

if (versionMinor >= 13) {
  Data(clientDbServices).Scenario(
    'Adding annotation before upgrade At service Level @ami-upgrade @pre-upgrade @pmm-upgrade',
    async ({
      annotationAPI, inventoryAPI, current,
    }) => {
      const {
        serviceType, name, annotationName,
      } = current;
      const { node_id, service_name } = await inventoryAPI.apiGetNodeInfoByServiceName(serviceType, name);
      const nodeName = await inventoryAPI.getNodeName(node_id);

      await annotationAPI.setAnnotation(annotationName, 'Upgrade-PMM-T878', nodeName, service_name, 200);
    },
  );
}

if (versionMinor >= 23) {
  Data(sslinstances).Scenario(
    'PMM-T948 PMM-T947 Verify Adding Postgresql, MySQL, MongoDB SSL services remotely via API before upgrade @pre-upgrade @pmm-upgrade',
    async ({
      I, remoteInstancesPage, pmmInventoryPage, current, addInstanceAPI, inventoryAPI,
    }) => {
      const {
        serviceName, serviceType, version, container,
      } = current;
      let details;
      const remoteServiceName = `remote_api_${serviceName}`;

      if (serviceType === 'postgres_ssl') {
        details = {
          serviceName: remoteServiceName,
          serviceType,
          port: '5432',
          database: 'postgres',
          address: container,
          username: 'pmm',
          password: 'pmm',
          cluster: 'pgsql_remote_cluster',
          environment: 'pgsql_remote_cluster',
          tlsCAFile: await remoteInstancesPage.getFileContent(`${pathToPMMFramework}tls-ssl-setup/postgres/${version}/ca.crt`),
          tlsKeyFile: await remoteInstancesPage.getFileContent(`${pathToPMMFramework}tls-ssl-setup/postgres/${version}/client.pem`),
          tlsCertFile: await remoteInstancesPage.getFileContent(`${pathToPMMFramework}tls-ssl-setup/postgres/${version}/client.crt`),
        };
        await addInstanceAPI.addPostgreSqlSSL(details);
        I.wait(5);
        await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
          {
            serviceType: 'POSTGRESQL_SERVICE',
            service: 'postgresql',
          },
          remoteServiceName,
        );
      }

      if (serviceType === 'mysql_ssl') {
        details = {
          serviceName: remoteServiceName,
          serviceType,
          port: '3306',
          address: container,
          username: 'pmm',
          password: 'pmm',
          cluster: 'mysql_ssl_remote_cluster',
          environment: 'mysql_ssl_remote_cluster',
          tlsCAFile: await remoteInstancesPage.getFileContent(`${adminPage.pathToPMMTests}tls-ssl-setup/mysql/${version}/ca.pem`),
          tlsKeyFile: await remoteInstancesPage.getFileContent(`${adminPage.pathToPMMTests}tls-ssl-setup/mysql/${version}/client-key.pem`),
          tlsCertFile: await remoteInstancesPage.getFileContent(`${adminPage.pathToPMMTests}tls-ssl-setup/mysql/${version}/client-cert.pem`),
        };
        await addInstanceAPI.addMysqlSSL(details);
        I.wait(5);
        await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
          {
            serviceType: 'MYSQL_SERVICE',
            service: 'mysql',
          },
          remoteServiceName,
        );
      }

      if (serviceType === 'mongodb_ssl') {
        details = {
          serviceName: remoteServiceName,
          serviceType,
          port: '27017',
          address: container,
          cluster: 'mongodb_ssl_remote_cluster',
          environment: 'mongodb_ssl_remote_cluster',
          tls_certificate_file_password: await remoteInstancesPage.getFileContent(`${pathToPMMFramework}tls-ssl-setup/mongodb/${version}/client.key`),
          tls_certificate_key: await remoteInstancesPage.getFileContent(`${pathToPMMFramework}tls-ssl-setup/mongodb/${version}/client.pem`),
          tls_ca: await remoteInstancesPage.getFileContent(`${pathToPMMFramework}tls-ssl-setup/mongodb/${version}/ca.crt`),
        };
        await addInstanceAPI.addMongoDBSSL(details);
        I.wait(5);
        await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
          {
            serviceType: 'MONGODB_SERVICE',
            service: 'mongodb',
          },
          remoteServiceName,
        );
      }
    },
  );
}

if (versionMinor >= 21) {
  Data(clientDbServices).Scenario(
    'Adding custom agent Password, Custom Label before upgrade At service Level @pre-upgrade @pmm-upgrade',
    async ({
      I, inventoryAPI, current,
    }) => {
      const {
        serviceType, name, upgrade_service,
      } = current;
      const {
        service_id, node_id, address, port,
      } = await inventoryAPI.apiGetNodeInfoByServiceName(serviceType, name);

      const { pmm_agent_id } = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);
      let output;

      switch (serviceType) {
        case 'MYSQL_SERVICE':
          output = await I.verifyCommand(
            `pmm-admin add mysql --node-id=${node_id} --pmm-agent-id=${pmm_agent_id} --port=${port} --password=ps --host=${address} --query-source=perfschema --agent-password=uitests --custom-labels="testing=upgrade" ${upgrade_service}`,
          );
          break;
        case 'POSTGRESQL_SERVICE':
          output = await I.verifyCommand(
            `pmm-admin add postgresql --node-id=${node_id} --pmm-agent-id=${pmm_agent_id} --port=${port} --host=${address} --agent-password=uitests --custom-labels="testing=upgrade" ${upgrade_service}`,
          );
          break;
        case 'MONGODB_SERVICE':
          output = await I.verifyCommand(
            `pmm-admin add mongodb --node-id=${node_id} --username=pmm_mongodb --password=secret --pmm-agent-id=${pmm_agent_id} --port=${port} --host=${address} --agent-password=uitests --custom-labels="testing=upgrade" ${upgrade_service}`,
          );
          break;
        default:
      }
    },
  );
}

Scenario(
  'Setup Prometheus Alerting with external Alert Manager via API PMM-Settings @pre-upgrade @pmm-upgrade',
  async ({ settingsAPI }) => {
    await settingsAPI.changeSettings(alertManager);
  },
);
*/

Scenario(
  'PMM-T3 Verify user is able to Upgrade PMM version [blocker] @pmm-upgrade @ami-upgrade  ',
  async ({ I, homePage }) => {
    I.amOnPage(homePage.url);
    await homePage.upgradePMM(versionMinor);
  },
).retry(0);

/*
Scenario(
  'Run queries for MongoDB after upgrade @post-upgrade @pmm-upgrade',
  async ({ I }) => {
    const col = await I.mongoCreateCollection('local', 'e2e');

    await col.insertOne({ a: '111' });
    await col.findOne();
  },
);

Scenario(
  'PMM-T391 Verify that custom home dashboard stays as home dashboard after upgrade @post-upgrade @ami-upgrade @pmm-upgrade',
  async ({ I, grafanaAPI, dashboardPage }) => {
    I.amOnPage('');
    dashboardPage.waitForDashboardOpened();
    dashboardPage.verifyMetricsExistence(['Custom Panel']);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
    I.seeInCurrentUrl(grafanaAPI.customDashboardName);
  },
);

Scenario(
  'PMM-T998 - Verify dashboard folders after upgrade @pmm-upgrade @ami-upgrade @post-upgrade',
  async ({
    I, searchDashboardsModal, grafanaAPI, homePage,
  }) => {
    await homePage.open();
    I.click(dashboardPage.fields.breadcrumbs.dashboardName);
    searchDashboardsModal.waitForOpened();
    const actualFolders = (await searchDashboardsModal.getFoldersList());

    I.assertDeepIncludeMembers(actualFolders, ['Starred', grafanaAPI.customFolderName]);
    I.seeElement(searchDashboardsModal.fields.folderItemLocator(grafanaAPI.customDashboardName));
  },
);

Scenario(
  'PMM-T1091 - Verify PMM Dashboards folders are correct @pmm-upgrade @ami-upgrade @post-upgrade',
  async ({
    I, searchDashboardsModal, grafanaAPI, homePage,
  }) => {
    const foldersNames = Object.values(searchDashboardsModal.folders).map((folder) => folder.name);

    foldersNames.unshift('Recent');
    if (versionMinor < 25) {
      foldersNames.push('PMM');
    }

    await homePage.open();
    I.click(dashboardPage.fields.breadcrumbs.dashboardName);
    searchDashboardsModal.waitForOpened();
    const actualFolders = (await searchDashboardsModal.getFoldersList())
      // these folders verified in dedicated test.
      .filter((value) => value !== 'Starred' && value !== grafanaAPI.customFolderName);

    I.assertDeepMembers(actualFolders, foldersNames);
  },
);

if (versionMinor < 15) {
  Scenario(
    'PMM-T268 - Verify Failed check singlestats after upgrade from old versions @post-upgrade @pmm-upgrade',
    async ({
      I, homePage,
    }) => {
      await homePage.open();
      I.waitForVisible(homePage.fields.sttDisabledFailedChecksPanelSelector, 15);
    },
  );
}

if (versionMinor >= 15) {
  Scenario(
    'Verify user has failed checks after upgrade / STT on @post-upgrade @pmm-upgrade',
    async ({
      I,
      pmmSettingsPage,
      securityChecksAPI,
      databaseChecksPage,
    }) => {
      // Wait for 45 seconds to have latest check results
      I.wait(45);
      // Verify STT is enabled
      I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
      I.waitForVisible(pmmSettingsPage.fields.sttSwitchSelector, 30);
      pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.sttSwitchSelectorInput, 'on');

      I.amOnPage(databaseChecksPage.url);
      I.waitForVisible(databaseChecksPage.buttons.startDBChecks, 30);
      // Verify there is failed check
      await securityChecksAPI.verifyFailedCheckExists(failedCheckMessage);
    },
  );

  Scenario(
    'Verify Redis as external Service Works After Upgrade @post-upgrade @pmm-upgrade',
    async ({
      I, grafanaAPI, remoteInstancesHelper,
    }) => {
      // Make sure Metrics are hitting before Upgrade
      const metricName = 'redis_uptime_in_seconds';
      const headers = { Authorization: `Basic ${await I.getAuth()}` };

      await grafanaAPI.checkMetricExist(metricName);
      await grafanaAPI.checkMetricExist(metricName, { type: 'node_name', value: 'redis_external_remote' });
      await grafanaAPI.checkMetricExist(metricName, { type: 'service_name', value: 'redis_external_2' });

      const response = await I.sendGetRequest('prometheus/api/v1/targets', headers);
      const targets = response.data.data.activeTargets.find(
        (o) => o.labels.external_group === 'redis-remote',
      );

      const expectedScrapeUrl = `${remoteInstancesHelper.remote_instance.external.redis.schema}://${remoteInstancesHelper.remote_instance.external.redis.host
      }:${remoteInstancesHelper.remote_instance.external.redis.port}${remoteInstancesHelper.remote_instance.external.redis.metricsPath}`;

      assert.ok(targets.scrapeUrl === expectedScrapeUrl,
        `Active Target for external service Post Upgrade has wrong Address value, value found is ${targets.scrapeUrl} and value expected was ${expectedScrapeUrl}`);
      assert.ok(targets.health === 'up', `Active Target for external service Post Upgrade health value is not up! value found ${targets.health}`);
    },
  );
}

if (versionMinor >= 16) {
  Scenario(
    'Verify disabled checks remain disabled after upgrade @post-upgrade @pmm-upgrade',
    async ({
      I,
      allChecksPage,
    }) => {
      const checkName = 'MongoDB Version';

      I.amOnPage(allChecksPage.url);
      I.waitForVisible(allChecksPage.buttons.disableEnableCheck(checkName));
      I.seeTextEquals('Enable', allChecksPage.buttons.disableEnableCheck(checkName));
      I.seeTextEquals('Disabled', allChecksPage.elements.statusCellByName(checkName));
    },
  );

  Scenario(
    'Verify silenced checks remain silenced after upgrade @post-upgrade @pmm-upgrade',
    async ({
      I,
      databaseChecksPage,
    }) => {
      I.amOnPage(databaseChecksPage.url);

      I.waitForVisible(failedCheckRowLocator, 30);
      I.dontSeeElement(failedCheckRowLocator.find('td')
        .withText(emptyPasswordSummary));

      I.click(databaseChecksPage.buttons.toggleSilenced);

      I.seeElement(failedCheckRowLocator.find('td')
        .withText(emptyPasswordSummary));
      I.seeElement(failedCheckRowLocator.find('td')
        .withText('Silenced'));
    },
  );

  Scenario(
    'Verify check intervals remain the same after upgrade @post-upgrade @pmm-upgrade',
    async ({
      I,
      allChecksPage,
    }) => {
      const checkName = 'PostgreSQL Version';

      I.amOnPage(allChecksPage.url);
      I.waitForVisible(allChecksPage.buttons.disableEnableCheck(checkName));
      I.seeTextEquals('Frequent', allChecksPage.elements.intervalCellByName(checkName));
    },
  );

  Scenario(
    'Verify settings for intervals remain the same after upgrade @post-upgrade @pmm-upgrade',
    async ({
      I,
      pmmSettingsPage,
    }) => {
      I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
      I.waitForVisible(pmmSettingsPage.fields.rareIntervalInput, 30);

      I.seeInField(pmmSettingsPage.fields.rareIntervalInput, '78');
      I.seeInField(pmmSettingsPage.fields.standartIntervalInput, '1');
      I.seeInField(pmmSettingsPage.fields.frequentIntervalInput, '4');
    },
  );
}

if (iaReleased) {
  Scenario.skip(
    'PMM-T577 Verify user can see IA alerts after upgrade @ami-upgrade @pmm-upgrade',
    async ({
      I, alertsPage, alertsAPI,
    }) => {
      const alertName = 'PostgreSQL too many connections (pmm-server-postgresql)';

      // Verify Alert is present
      await alertsAPI.waitForAlerts(60, 1);
      const alerts = await alertsAPI.getAlertsList();

      assert.ok(alerts[0].summary === alertName, `Didn't find alert with name ${alertName}`);

      I.amOnPage(alertsPage.url);
      I.waitForElement(alertsPage.elements.alertRow(alertName), 30);
    },
  );
} else {
  Scenario(
    'PMM-T531 Verify IA is disabled by default after upgrading from older PMM version @post-upgrade @ami-upgrade @pmm-upgrade',
    async ({
      I, pmmSettingsPage,
    }) => {
      I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
      I.waitForVisible(pmmSettingsPage.fields.iaSwitchSelector, 30);
      I.dontSeeElement(pmmSettingsPage.communication.communicationSection);
      pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.iaSwitchSelectorInput, 'off');
    },
  );
}

Scenario(
  'Verify Agents are RUNNING after Upgrade (API) [critical] @post-upgrade @ami-upgrade @pmm-upgrade',
  async ({ inventoryAPI }) => {
    for (const service of Object.values(remoteInstancesHelper.serviceTypes)) {
      if (service) {
        await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
          service,
          remoteInstancesHelper.upgradeServiceNames[service.service],
        );
      }
    }
  },
);

Scenario(
  'Verify user can see Update widget [critical] @post-upgrade @ami-upgrade @pmm-upgrade',
  async ({ I, homePage }) => {
    I.amOnPage(homePage.url);
    await homePage.verifyPostUpdateWidgetIsPresent();
  },
);

Scenario(
  'PMM-T262 Open PMM Settings page and verify DATA_RETENTION value is set to 2 days, Custom Resolution is still preserved after upgrade @ami-upgrade @post-upgrade @pmm-upgrade',
  async ({ I, pmmSettingsPage }) => {
    const advancedSection = pmmSettingsPage.sectionTabsList.advanced;
    const metricResoltionSection = pmmSettingsPage.sectionTabsList.metrics;

    I.amOnPage(pmmSettingsPage.url);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(advancedSection, pmmSettingsPage.fields.advancedButton);
    await pmmSettingsPage.verifySettingsValue(pmmSettingsPage.fields.dataRetentionInput, 2);
    await pmmSettingsPage.expandSection(
      metricResoltionSection,
      pmmSettingsPage.fields.metricsResolutionButton,
    );
    await pmmSettingsPage.verifySettingsValue(pmmSettingsPage.fields.lowInput, 60);
    await pmmSettingsPage.verifySettingsValue(pmmSettingsPage.fields.mediumInput, 60);
    await pmmSettingsPage.verifySettingsValue(pmmSettingsPage.fields.highInput, 30);
  },
);

Scenario(
  'Verify user can see News Panel @post-upgrade @ami-upgrade @pmm-upgrade  ',
  async ({ I, homePage }) => {
    I.amOnPage(homePage.url);
    I.waitForVisible(homePage.fields.newsPanelTitleSelector, 30);
    I.waitForVisible(homePage.fields.newsPanelContentSelector, 30);
    const newsItems = await I.grabNumberOfVisibleElements(locate('article').inside(homePage.fields.newsPanelContentSelector));

    assert.ok(newsItems > 1, 'News Panel is empty');
  },
);

Scenario(
  'PMM-T424 Verify PT Summary Panel is available after Upgrade @post-upgrade @ami-upgrade @pmm-upgrade',
  async ({ I, dashboardPage }) => {
    const filter = 'Node Name';

    I.amOnPage(`${dashboardPage.nodeSummaryDashboard.url}&var-node_name=pmm-server`);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.applyFilter(filter, 'pmm-server');

    I.waitForElement(dashboardPage.nodeSummaryDashboard.ptSummaryDetail.reportContainer, 60);
    I.seeElement(dashboardPage.nodeSummaryDashboard.ptSummaryDetail.reportContainer);
  },
);

Scenario(
  'Verify Agents are RUNNING after Upgrade (UI) [critical] @ami-upgrade @post-upgrade @pmm-upgrade',
  async ({ I, pmmInventoryPage }) => {
    for (const service of Object.values(remoteInstancesHelper.upgradeServiceNames)) {
      if (service) {
        I.amOnPage(pmmInventoryPage.url);
        await pmmInventoryPage.verifyAgentHasStatusRunning(service);
      }
    }
  },
);

Scenario(
  'Verify Agents are Running and Metrics are being collected Post Upgrade (UI) [critical] @ami-upgrade @post-upgrade @pmm-upgrade',
  async ({ grafanaAPI }) => {
    const metrics = Object.keys(remoteInstancesHelper.upgradeServiceMetricNames);

    for (const service of Object.values(remoteInstancesHelper.upgradeServiceNames)) {
      if (service) {
        if (metrics.includes(service)) {
          const metricName = remoteInstancesHelper.upgradeServiceMetricNames[service];

          await grafanaAPI.checkMetricExist(metricName, { type: 'node_name', value: service });
        }
      }
    }
  },
);

Data(clientDbServices).Scenario(
  'Check Metrics for Client Nodes [critical] @post-client-upgrade  @ami-upgrade @post-upgrade @pmm-upgrade',
  async ({
    inventoryAPI, grafanaAPI, current,
  }) => {
    const metricName = current.metric;
    const { node_id } = await inventoryAPI.apiGetNodeInfoByServiceName(current.serviceType, current.name);
    const nodeName = await inventoryAPI.getNodeName(node_id);

    await grafanaAPI.checkMetricExist(metricName, { type: 'node_name', value: nodeName });
  },
);

Scenario(
  'Verify QAN has specific filters for Remote Instances after Upgrade (UI) @ami-upgrade @post-upgrade @pmm-upgrade',
  async ({
    I, qanPage, qanFilters, qanOverview,
  }) => {
    I.amOnPage(qanPage.url);
    qanFilters.waitForFiltersToLoad();
    await qanFilters.expandAllFilters();

    // Checking that Cluster filters are still in QAN after Upgrade
    for (const name of Object.keys(remoteInstancesHelper.upgradeServiceNames)) {
      if (remoteInstancesHelper.qanFilters.includes(name)) {
        const filter = qanFilters.getFilterLocator(name);

        qanFilters.waitForFiltersToLoad();
        qanOverview.waitForOverviewLoaded();

        I.waitForVisible(filter, 30);
        I.seeElement(filter);
      }
    }
  },
);

Scenario(
  'Verify Metrics from custom queries for mysqld_exporter after upgrade (UI) @post-client-upgrade @post-upgrade @ami-upgrade @pmm-upgrade',
  async ({ grafanaAPI }) => {
    const metricName = 'mysql_performance_schema_memory_summary_current_bytes';

    await grafanaAPI.checkMetricExist(metricName);
  },
);

Scenario(
  'Verify textfile collector extend metrics is still collected post upgrade (UI) @post-client-upgrade @post-upgrade @ami-upgrade @pmm-upgrade',
  async ({ grafanaAPI }) => {
    const metricName = 'node_role';

    await grafanaAPI.checkMetricExist(metricName);
  },
);

Scenario(
  'Verify Metrics from custom queries for postgres_exporter after upgrade (UI) @post-client-upgrade @post-upgrade @pmm-upgrade',
  async ({ grafanaAPI }) => {
    const metricName = 'pg_stat_user_tables_n_tup_ins';

    await grafanaAPI.checkMetricExist(metricName);
  },
);

Scenario(
  'PMM-T102 Verify Custom Prometheus Configuration File is still available at targets after Upgrade @ami-upgrade @post-upgrade @pmm-upgrade',
  async ({ I }) => {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const response = await I.sendGetRequest('prometheus/api/v1/targets', headers);

    const targets = response.data.data.activeTargets.find(
      (o) => o.labels.job === 'blackbox80',
    );

    assert.ok(targets.labels.job === 'blackbox80', 'Active Target from Custom Prometheus Config After Upgrade is not Available');
  },
);

if (versionMinor >= 13) {
  Data(clientDbServices).Scenario(
    'Verify added Annotations at service level, also available post upgrade @ami-upgrade @post-client-upgrade @post-upgrade @pmm-upgrade',
    async ({
      I, dashboardPage, current, inventoryAPI, adminPage,
    }) => {
      const {
        serviceType, name, annotationName, dashboard,
      } = current;
      const timeRange = 'Last 30 minutes';

      I.amOnPage(dashboard);
      dashboardPage.waitForDashboardOpened();
      await adminPage.applyTimeRange(timeRange);
      const { service_name } = await inventoryAPI.apiGetNodeInfoByServiceName(serviceType, name);

      await dashboardPage.applyFilter('Service Name', service_name);

      dashboardPage.verifyAnnotationsLoaded(annotationName);
      I.seeElement(dashboardPage.annotationText(annotationName), 10);
    },
  );
}

Scenario(
  'Check Prometheus Alerting Rules Persist Post Upgrade and Alerts are still Firing @post-upgrade @pmm-upgrade',
  async ({ settingsAPI, pmmSettingsPage }) => {
    const url = await settingsAPI.getSettings('alert_manager_url');
    const rule = await settingsAPI.getSettings('alert_manager_rules');

    assert.ok(url === alertManager.alertmanagerURL, `Alert Manager URL value is not persisted, expected value was ${alertManager.alertmanagerURL} but got ${url}`);
    assert.ok(rule === alertManager.alertmanagerRules, `Alert Manager Rule value is not valid, expected value was ${alertManager.alertmanagerRules} but got ${rule}`);
    await pmmSettingsPage.verifyAlertmanagerRuleAdded(pmmSettingsPage.alertManager.ruleName2, true);
  },
);

if (versionMinor >= 21) {
  Data(clientDbServices).Scenario(
    'Verify if Agents added with custom password and custom label work as expected Post Upgrade @post-client-upgrade @post-upgrade @pmm-upgrade',
    async ({
      current, inventoryAPI, grafanaAPI,
    }) => {
      const {
        serviceType, metric, upgrade_service,
      } = current;

      const {
        custom_labels,
      } = await inventoryAPI.apiGetNodeInfoByServiceName(serviceType, upgrade_service);

      await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: upgrade_service });
      if (serviceType !== 'MYSQL_SERVICE') {
        assert.ok(custom_labels, `Node Information for ${serviceType} added with ${upgrade_service} is empty, value returned are ${custom_labels}`);
        assert.ok(custom_labels.testing === 'upgrade', `Custom Labels for ${serviceType} added before upgrade with custom labels, doesn't have the same label post upgrade, value found ${custom_labels}`);
      }
    },
  );
}

if (versionMinor >= 23) {
  Data(sslinstances).Scenario(
    'Verify metrics from SSL instances on PMM-Server @post-upgrade @pmm-upgrade',
    async ({
      I, remoteInstancesPage, pmmInventoryPage, current, grafanaAPI,
    }) => {
      const {
        serviceName, metric,
      } = current;
      let response; let result;
      const remoteServiceName = `remote_api_${serviceName}`;

      // Waiting for metrics to start hitting for remotely added services
      I.wait(10);

      // verify metric for client container node instance
      response = await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: serviceName });
      result = JSON.stringify(response.data.data.result);

      assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${serviceName} should be available but got empty ${result}`);

      // verify metric for remote instance
      response = await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: remoteServiceName });
      result = JSON.stringify(response.data.data.result);

      assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${remoteServiceName} should be available but got empty ${result}`);
    },
  ).retry(1);

  Data(sslinstances).Scenario(
    'Verify dashboard for SSL Instances and services after upgrade @post-upgrade @pmm-upgrade',
    async ({
      I, dashboardPage, adminPage, current,
    }) => {
      const {
        serviceName, dashboard,
      } = current;

      const serviceList = [serviceName, `remote_api_${serviceName}`];

      for (const service of serviceList) {
        I.amOnPage();
        dashboardPage.waitForDashboardOpened(dashboard);
        await adminPage.applyTimeRange('Last 5 minutes');
        await dashboardPage.applyFilter('Service Name', service);
        adminPage.performPageDown(5);
        await dashboardPage.expandEachDashboardRow();
        adminPage.performPageUp(5);
        await dashboardPage.verifyThereAreNoGraphsWithNA();
        await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
      }
    },
  ).retry(1);

  Data(sslinstances).Scenario(
    'Verify QAN after upgrade for SSL Instances added @post-upgrade @pmm-upgrade',
    async ({
      I, qanOverview, qanFilters, qanPage, current, adminPage,
    }) => {
      const {
        serviceName,
      } = current;

      const serviceList = [serviceName, `remote_api_${serviceName}`];

      for (const service of serviceList) {
        I.amOnPage(qanPage.url);
        qanOverview.waitForOverviewLoaded();
        await adminPage.applyTimeRange('Last 5 minutes');
        qanOverview.waitForOverviewLoaded();
        qanFilters.waitForFiltersToLoad();
        await qanFilters.applySpecificFilter(service);
        qanOverview.waitForOverviewLoaded();
        const count = await qanOverview.getCountOfItems();

        assert.ok(count > 0, `The queries for service ${service} instance do NOT exist, check QAN Data`);
      }
    },
  ).retry(1);
}
*/
