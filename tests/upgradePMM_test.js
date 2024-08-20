const assert = require('assert');
const faker = require('faker');
const { generate } = require('generate-password');
const { storageLocationConnection } = require('./backup/pages/testData');
const {
  adminPage, remoteInstancesHelper, psMySql, pmmSettingsPage, dashboardPage, databaseChecksPage, scheduledAPI, locationsAPI,
} = inject();

const pathToPMMFramework = adminPage.pathToPMMTests;

const sslinstances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric', 'dashboard']);

// Unskip after https://jira.percona.com/browse/PMM-12640
// sslinstances.add(['pgsql_14_ssl_service', '14', 'pgsql_14', 'postgres_ssl', 'pg_stat_database_xact_rollback', dashboardPage.postgresqlInstanceOverviewDashboard.url]);
sslinstances.add(['mysql_8.0_ssl_service', '8.0', 'mysql_8.0', 'mysql_ssl', 'mysql_global_status_max_used_connections', dashboardPage.mySQLInstanceOverview.url]);
sslinstances.add(['mongodb_6.0_ssl_service', '6.0', 'mongodb_6.0', 'mongodb_ssl', 'mongodb_connections', dashboardPage.mongoDbInstanceOverview.url]);

const alertManager = {
  alertmanagerURL: 'http://192.168.0.1:9093',
  alertmanagerRules: pmmSettingsPage.alertManager.rule2,
};

const clientDbServices = new DataTable(['serviceType', 'name', 'metric', 'annotationName', 'dashboard', 'upgrade_service']);

clientDbServices.add(['MYSQL_SERVICE', 'ps_', 'mysql_global_status_max_used_connections', 'annotation-for-mysql', dashboardPage.mysqlInstanceSummaryDashboard.url, 'mysql_upgrade']);
clientDbServices.add(['POSTGRESQL_SERVICE', 'PGSQL_', 'pg_stat_database_xact_rollback', 'annotation-for-postgres', dashboardPage.postgresqlInstanceSummaryDashboard.url, 'pgsql_upgrade']);
// eslint-disable-next-line max-len
clientDbServices.add(['MONGODB_SERVICE', 'mongodb_', 'mongodb_connections', 'annotation-for-mongo', dashboardPage.mongoDbInstanceSummaryDashboard.url, 'mongo_upgrade']);

const connection = psMySql.defaultConnection;
const psServiceName = 'upgrade-stt-ps-5.7.30';
const failedCheckRowLocator = databaseChecksPage.elements
  .failedCheckRowByServiceName(psServiceName);
const ruleName = 'Alert Rule for upgrade';
const failedCheckMessage = 'Newer version of Percona Server for MySQL is available';

const mongoServiceName = 'mongo-backup-upgrade';
const location = {
  name: 'upgrade-location',
  description: 'upgrade-location description',
  ...locationsAPI.storageLocationConnection,
};
const backupName = 'upgrade_backup_test';
const scheduleName = 'upgrade_schedule';
const scheduleSettings = {
  cron_expression: '*/20 * * * *',
  name: scheduleName,
  mode: scheduledAPI.backupModes.snapshot,
  description: '',
  retry_interval: '30s',
  retries: 0,
  enabled: true,
  retention: 1,
};

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

BeforeSuite(async ({ I, codeceptjsConfig, credentials }) => {
  const mysqlComposeConnection = {
    host: (process.env.AMI_UPGRADE_TESTING_INSTANCE === 'true' || process.env.OVF_UPGRADE_TESTING_INSTANCE === 'true' ? process.env.VM_CLIENT_IP : '127.0.0.1'),
    port: (process.env.AMI_UPGRADE_TESTING_INSTANCE === 'true' || process.env.OVF_UPGRADE_TESTING_INSTANCE === 'true' ? remoteInstancesHelper.remote_instance.mysql.ps_5_7.port : '3309'),
    username: connection.username,
    password: connection.password,
  };

  psMySql.connectToPS(mysqlComposeConnection);

  // Connect to MongoDB
  const mongoConnection = {
    host: (process.env.AMI_UPGRADE_TESTING_INSTANCE === 'true' || process.env.OVF_UPGRADE_TESTING_INSTANCE === 'true' ? process.env.VM_CLIENT_IP : codeceptjsConfig.config.helpers.MongoDBHelper.host),
    port: (process.env.AMI_UPGRADE_TESTING_INSTANCE === 'true' || process.env.OVF_UPGRADE_TESTING_INSTANCE === 'true' ? remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.port : codeceptjsConfig.config.helpers.MongoDBHelper.port),
    username: codeceptjsConfig.config.helpers.MongoDBHelper.username,
    password: codeceptjsConfig.config.helpers.MongoDBHelper.password,
  };

  await I.mongoConnect(mongoConnection);
  // Init data for Backup Management test
  if (process.env.AMI_UPGRADE_TESTING_INSTANCE !== 'true' && process.env.OVF_UPGRADE_TESTING_INSTANCE !== 'true') {
    const replicaPrimary = await I.getMongoClient({
      username: credentials.mongoReplicaPrimaryForBackups.username,
      password: credentials.mongoReplicaPrimaryForBackups.password,
      port: credentials.mongoReplicaPrimaryForBackups.port,
    });

    try {
      const collection = replicaPrimary.db('test').collection('e2e');

      await collection.insertOne({ number: 1, name: 'John' });
    } finally {
      await replicaPrimary.close();
    }
  }
});

AfterSuite(async ({ I, psMySql }) => {
  await psMySql.disconnectFromPS();
  await I.mongoDisconnect();
});

Scenario(
  'Add AMI Instance ID @ami-upgrade',
  async ({ amiInstanceAPI }) => {
    await amiInstanceAPI.verifyAmazonInstanceId(process.env.AMI_INSTANCE_ID);
  },
);

Scenario(
  'PMM-T289 Verify Whats New link is presented on Update Widget @ovf-upgrade @ami-upgrade @pre-upgrade @pmm-upgrade',
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

Scenario(
  'PMM-T288 Verify user can see Update widget before upgrade [critical] @pre-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
  async ({ I, homePage }) => {
    I.amOnPage(homePage.url);
    await homePage.verifyPreUpdateWidgetIsPresent(versionMinor);
  },
);

Scenario(
  'PMM-T391 PMM-T1818 Verify user is able to create and set custom home dashboard'
    + ' @pre-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
  async ({
    I, grafanaAPI, dashboardPage, searchDashboardsModal,
  }) => {
    const insightFolder = await grafanaAPI.lookupFolderByName(searchDashboardsModal.folders.insight.name);

    await grafanaAPI.createCustomDashboard(grafanaAPI.randomDashboardName, insightFolder.id, null, ['pmm-qa', grafanaAPI.randomTag]);
    const folder = await grafanaAPI.createFolder(grafanaAPI.customFolderName);
    let additionalPanel = null;

    // Panels Library is present from 2.27.0
    if (versionMinor > 26) {
      const libResp = await grafanaAPI.savePanelToLibrary('Lib Panel', folder.id);
      const libPanel = libResp.result.model;

      libPanel.libraryPanel.meta = libResp.result.meta;
      libPanel.libraryPanel.version = 1;
      libPanel.libraryPanel.uid = libResp.result.uid;
      additionalPanel = [libPanel];
    }

    const resp = await grafanaAPI.createCustomDashboard(grafanaAPI.customDashboardName, folder.id, additionalPanel);

    await grafanaAPI.starDashboard(resp.id);
    await grafanaAPI.setHomeDashboard(resp.id);

    I.amOnPage('');
    dashboardPage.waitForDashboardOpened();
    // dashboardPage.verifyMetricsExistence(['Custom Panel']);
    I.seeInCurrentUrl(grafanaAPI.customDashboardName);
  },
).retry(0);

Scenario(
  'Verify user is able to set custom Settings like Data_retention, Resolution @pre-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
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
  Scenario.skip(
    'Verify user has failed checks before upgrade @pre-upgrade @pmm-upgrade',
    async ({
      I,
      settingsAPI,
      databaseChecksPage,
      advisorsAPI,
      addInstanceAPI,
      inventoryAPI,
    }) => {
      const runChecks = locate('button')
        .withText('Run DB checks');

      await psMySql.dropUser();
      await psMySql.createUser();
      await settingsAPI.changeSettings({ stt: true });
      await addInstanceAPI.addInstanceForSTT(connection, psServiceName);

      await advisorsAPI.startSecurityChecks();
      // Waiting to have results
      I.wait(60);
      // disable check, change interval for a check, change interval settings
      if (versionMinor >= 16) {
        await advisorsAPI.disableCheck('mongodb_version');
        await advisorsAPI.changeCheckInterval('postgresql_version');
        await settingsAPI.setCheckIntervals({
          ...settingsAPI.defaultCheckIntervals,
          standard_interval: '3600s',
        });
        I.amOnPage(databaseChecksPage.url);
      } else {
        I.amOnPage(databaseChecksPage.oldUrl);
      }

      // I.waitForVisible(runChecks, 30);
      // I.waitForVisible(failedCheckRowLocator, 60);

      // Check that there are failed checks
      // await advisorsAPI.verifyFailedCheckExists(emptyPasswordSummary);
      // await advisorsAPI.verifyFailedCheckExists(failedCheckMessage);

      // Silence mysql Empty Password failed check
      // I.waitForVisible(failedCheckRowLocator, 30);

      if (versionMinor >= 27) {
        const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MYSQL_SERVICE', psServiceName);
        const { alert_id } = (await advisorsAPI.getFailedChecks(service_id))
          .find(({ summary }) => summary === failedCheckMessage);

        await advisorsAPI.toggleChecksAlert(alert_id);
      } else {
        I.waitForVisible(failedCheckRowLocator, 30);
        I.click(failedCheckRowLocator.find('button').withText('Silence'));
      }
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
            `pmm-admin add mysql --node-id=${node_id} --pmm-agent-id=${pmm_agent_id} --port=${port} --password=GRgrO9301RuF --host=${address} --query-source=perfschema --agent-password=uitests --custom-labels="testing=upgrade" ${upgrade_service}`,
          );
          break;
        case 'POSTGRESQL_SERVICE':
          output = await I.verifyCommand(
            `pmm-admin add postgresql --username=postgres --password=oFukiBRg7GujAJXq3tmd --node-id=${node_id} --pmm-agent-id=${pmm_agent_id} --port=${port} --host=${address} --agent-password=uitests --custom-labels="testing=upgrade" ${upgrade_service}`,
          );
          break;
        case 'MONGODB_SERVICE':
          output = await I.verifyCommand(
            `pmm-admin add mongodb --username=pmm_mongodb --password=GRgrO9301RuF --port=27023 --host=${address} --agent-password=uitests --custom-labels="testing=upgrade" ${upgrade_service}`,
          );
          break;
        default:
      }
    },
  );
}

Scenario(
  'Verify user can create Remote Instances before upgrade @pre-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
  async ({ addInstanceAPI }) => {
    // Adding instances for monitoring

    const aurora_details = {
      add_node: {
        node_name: 'pmm-qa-aurora2-mysql-instance-1',
        node_type: 'REMOTE_NODE',
      },
      aws_access_key: remoteInstancesHelper.remote_instance.aws.aurora.aws_access_key,
      aws_secret_key: remoteInstancesHelper.remote_instance.aws.aurora.aws_secret_key,
      address: remoteInstancesHelper.remote_instance.aws.aurora.aurora2.address,
      service_name: 'pmm-qa-aurora2-mysql-instance-1',
      port: remoteInstancesHelper.remote_instance.aws.aurora.port,
      username: remoteInstancesHelper.remote_instance.aws.aurora.username,
      password: remoteInstancesHelper.remote_instance.aws.aurora.aurora2.password,
      instance_id: 'pmm-qa-aurora2-mysql-instance-1',
      cluster: 'rdsaurora',
    };

    for (const type of Object.values(remoteInstancesHelper.instanceTypes)) {
      if (type) {
        if (type === 'RDSAurora') {
          await addInstanceAPI.apiAddInstance(
            type,
            remoteInstancesHelper.upgradeServiceNames[type.toLowerCase()],
            aurora_details,
          );
        } else {
          await addInstanceAPI.apiAddInstance(
            type,
            remoteInstancesHelper.upgradeServiceNames[type.toLowerCase()],
          );
        }
      }
    }
  },
);

if (versionMinor < 16 && versionMinor >= 10) {
  Scenario(
    'PMM-T720 Verify Platform registration for PMM before 2.16.0 @pre-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
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
    'PMM-T577 Verify user is able to see IA alerts before upgrade @pre-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
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
    'Adding annotation before upgrade At service Level @ami-upgrade @ovf-upgrade @pre-upgrade @pmm-upgrade',
    async ({
      annotationAPI, inventoryAPI, current,
    }) => {
      const {
        serviceType, name, annotationName,
      } = current;
      const { node_id, service_name } = await inventoryAPI.apiGetNodeInfoByServiceName(serviceType, name, 'ssl');
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

Scenario(
  'Setup Prometheus Alerting with external Alert Manager via API PMM-Settings @pre-upgrade @pmm-upgrade',
  async ({ settingsAPI }) => {
    await settingsAPI.changeSettings(alertManager);
  },
);

// if (versionMinor >= 32) {
  Scenario(
    'Create backups data to check after upgrade @pre-upgrade @pmm-upgrade',
    async ({
      I, settingsAPI, locationsAPI, backupAPI, scheduledAPI, inventoryAPI, backupInventoryPage, scheduledPage, credentials,
    }) => {
      if (!await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName)) {
        await I.say(await I.verifyCommand(`docker exec rs101 pmm-admin add mongodb --port=27017 --username=${credentials.mongoReplicaPrimaryForBackups.username} --password=${credentials.mongoReplicaPrimaryForBackups.password} --service-name=${mongoServiceName} --replication-set=rs --cluster=rs`));
      }

      await settingsAPI.changeSettings({ backup: true });
      await locationsAPI.clearAllLocations(true);
      const locationId = await locationsAPI.createStorageLocation(
        location.name,
        locationsAPI.storageType.s3,
        locationsAPI.storageLocationConnection,
        location.description,
      );

      console.log(`Location id is: ${locationId}`);

      const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);

      console.log(`Service ID is: ${service_id}`);

      const backupId = await backupAPI.startBackup(backupName, service_id, locationId);

      // Every 20 mins schedule
      const schedule = {
        service_id,
        location_id: locationId,
        ...scheduleSettings,
      };

      await scheduledAPI.createScheduledBackup(schedule);

      /** waits and success check grouped together to speedup test */
      await backupAPI.waitForBackupFinish(backupId);
      // await backupAPI.waitForBackupFinish(null, schedule.name, 240);
      backupInventoryPage.openInventoryPage();
      backupInventoryPage.verifyBackupSucceeded(backupName);
      scheduledPage.openScheduledBackupsPage();
      I.wait(1500);
      I.waitForVisible(scheduledPage.elements.scheduleName(`${schedule.name}-wrong`), 20);
    },
  ).retry(0);
// }

Scenario(
  'PMM-T3 Verify user is able to Upgrade PMM version [blocker] @pmm-upgrade @ovf-upgrade @ami-upgrade  ',
  async ({ I, homePage }) => {
    I.amOnPage(homePage.url);
    await homePage.upgradePMM(versionMinor);
  },
).retry(0);

Scenario(
  'Run queries for MongoDB after upgrade @post-upgrade @pmm-upgrade',
  async ({ I }) => {
    const col = await I.mongoCreateCollection('local', 'e2e');

    await col.insertOne({ a: '111' });
    await col.findOne();
  },
);

Scenario('@PMM-T1647 Verify pmm-server package doesn\'t exist @post-upgrade @pmm-upgrade', async ({ I }) => {
  await I.amOnPage('');
  const packages = await I.verifyCommand('docker exec pmm-server rpm -qa');

  I.assertTrue(!packages.includes('pmm-server'), 'pmm-server package present in package list.');
});

Scenario(
  'PMM-T391 PMM-T1818 Verify that custom home dashboard stays as home dashboard after upgrade'
    + ' @post-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
  async ({ I, grafanaAPI, dashboardPage }) => {
    I.amOnPage('');
    dashboardPage.waitForDashboardOpened();
    dashboardPage.verifyMetricsExistence([grafanaAPI.customPanelName]);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
    I.seeInCurrentUrl(grafanaAPI.customDashboardName);

    // Panels Library is present from 2.27.0
    if (versionMinor > 26) {
      await I.say('Verify there is no "Error while loading library panels" errors on dashboard and no errors in grafana.log');
      I.wait(1);
      let errorLogs;

      if (process.env.AMI_UPGRADE_TESTING_INSTANCE !== 'true' && process.env.OVF_UPGRADE_TESTING_INSTANCE !== 'true') {
        errorLogs = await I.verifyCommand('docker exec pmm-server cat /srv/logs/grafana.log | grep level=error');
      } else {
        errorLogs = await I.verifyCommand('cat /srv/logs/grafana.log | grep level=error || true');
      }

      const loadingLibraryErrorLine = errorLogs.split('\n')
        .filter((line) => line.includes('Error while loading library panels'));

      I.assertEmpty(
        loadingLibraryErrorLine,
        `Logs contains errors about while loading library panels! \n The line is: \n ${loadingLibraryErrorLine}`,
      );
    }
  },
);

Scenario(
  'PMM-T998 - Verify dashboard folders after upgrade @pmm-upgrade @ovf-upgrade @ami-upgrade @post-upgrade',
  async ({
    I, searchDashboardsModal, grafanaAPI, homePage,
  }) => {
    await homePage.open();
    I.click(dashboardPage.fields.breadcrumbs.dashboardName);
    searchDashboardsModal.waitForOpened();
    const actualFolders = (await searchDashboardsModal.getFoldersList());

    I.assertDeepIncludeMembers(actualFolders, ['Starred', grafanaAPI.customFolderName]);
    I.click(searchDashboardsModal.fields.folderItemLocator(grafanaAPI.customFolderName));
    I.seeElement(searchDashboardsModal.fields.folderItemLocator(grafanaAPI.customDashboardName));
  },
);

Scenario(
  'PMM-T1091 - Verify PMM Dashboards folders are correct @pmm-upgrade @ovf-upgrade @ami-upgrade @post-upgrade',
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

Scenario(
  'PMM-T1003 - Verify UI upgrade with Custom dashboard @pmm-upgrade @ovf-upgrade @ami-upgrade @post-upgrade',
  async ({
    I, searchDashboardsModal, grafanaAPI, homePage,
  }) => {
    await homePage.open();
    I.click(dashboardPage.fields.breadcrumbs.dashboardName);
    searchDashboardsModal.waitForOpened();
    searchDashboardsModal.collapseFolder('Recent');
    searchDashboardsModal.expandFolder(searchDashboardsModal.folders.insight.name);
    I.seeElement(searchDashboardsModal.fields.folderItemLocator(grafanaAPI.randomDashboardName));
    I.seeElement(searchDashboardsModal.fields.folderItemWithTagLocator(grafanaAPI.randomDashboardName, grafanaAPI.randomTag));
  },
);

Scenario(
  'PMM-T268 - Verify Failed check singlestats after upgrade from old versions @post-upgrade @pmm-upgrade',
  async ({
    I, homePage,
  }) => {
    await homePage.open();
    I.dontSeeElement(homePage.fields.sttDisabledFailedChecksPanelSelector, 15);
    I.waitForVisible(homePage.fields.failedChecksPanelContent, 30);
  },
);

if (versionMinor >= 15) {
  Scenario.skip(
    'Verify user has failed checks after upgrade / STT on @post-upgrade @pmm-upgrade',
    async ({
      I,
      pmmSettingsPage,
      advisorsAPI,
      advisorsPage,
    }) => {
      // Wait for 45 seconds to have latest check results
      I.wait(45);
      // Verify STT is enabled
      I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
      I.waitForVisible(pmmSettingsPage.fields.sttSwitchSelector, 30);
      pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.sttSwitchSelectorInput, 'on');

      I.amOnPage(advisorsPage.url);
      I.waitForVisible(advisorsPage.buttons.startDBChecks, 30);
      // Verify there is failed check
      await advisorsAPI.verifyFailedCheckExists(failedCheckMessage);
    },
  );

  Scenario(
    'Verify Redis as external Service Works After Upgrade @post-upgrade @post-client-upgrade @pmm-upgrade',
    async ({
      I, grafanaAPI, remoteInstancesHelper,
    }) => {
      // Make sure Metrics are hitting before Upgrade
      const metricName = 'redis_uptime_in_seconds';
      const headers = { Authorization: `Basic ${await I.getAuth()}` };

      await grafanaAPI.checkMetricExist(metricName);
      await grafanaAPI.checkMetricExist(metricName, { type: 'node_name', value: 'redis_external_remote' });
      // removing check for upgrade verification
      // await grafanaAPI.checkMetricExist(metricName, { type: 'service_name', value: 'redis_external_2' });

      const response = await I.sendGetRequest('prometheus/api/v1/targets', headers);
      const targets = response.data.data.activeTargets.find(
        (o) => o.labels.external_group === 'redis-remote',
      );

      const expectedScrapeUrl = `${remoteInstancesHelper.remote_instance.external.redis.schema}://${remoteInstancesHelper.remote_instance.external.redis.host
      }:${remoteInstancesHelper.remote_instance.external.redis.port}${remoteInstancesHelper.remote_instance.external.redis.metricsPath}`;

      assert.ok(
        targets.scrapeUrl === expectedScrapeUrl,
        `Active Target for external service Post Upgrade has wrong Address value, value found is ${targets.scrapeUrl} and value expected was ${expectedScrapeUrl}`,
      );
      assert.ok(targets.health === 'up', `Active Target for external service Post Upgrade health value is not up! value found ${targets.health}`);
    },
  );
}

if (versionMinor >= 16) {
  Scenario.skip(
    'Verify disabled checks remain disabled after upgrade @post-upgrade @pmm-upgrade',
    async ({
      I,
      advisorsPage,
    }) => {
      const checkName = 'MongoDB Version';

      I.amOnPage(advisorsPage.url);
      I.waitForVisible(advisorsPage.buttons.disableEnableCheck(checkName));
      I.seeTextEquals('Enable', advisorsPage.buttons.disableEnableCheck(checkName));
      I.seeTextEquals('Disabled', advisorsPage.elements.statusCellByName(checkName));
    },
  );

  Scenario.skip(
    'Verify check intervals remain the same after upgrade @post-upgrade @pmm-upgrade',
    async ({
      I,
      advisorsPage,
    }) => {
      const checkName = 'PostgreSQL Version';

      I.amOnPage(advisorsPage.url);
      I.waitForVisible(advisorsPage.buttons.disableEnableCheck(checkName));
      I.seeTextEquals('Frequent', advisorsPage.elements.intervalCellByName(checkName));
    },
  );

  Scenario.skip(
    'Verify silenced checks remain silenced after upgrade @post-upgrade @pmm-upgrade',
    async ({
      I,
      databaseChecksPage, inventoryAPI, advisorsAPI,
    }) => {
      const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MYSQL_SERVICE', psServiceName);

      await advisorsAPI.waitForFailedCheckExistance(failedCheckMessage, psServiceName);
      databaseChecksPage.openFailedChecksListForService(service_id);

      I.waitForVisible(databaseChecksPage.elements.failedCheckRowBySummary(failedCheckMessage), 30);
      I.seeAttributesOnElements(databaseChecksPage.buttons.toggleFailedCheckBySummary(failedCheckMessage), { title: 'Activate' });
    },
  );

  Scenario.skip(
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
    'PMM-T577 Verify user can see IA alerts after upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
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
    'PMM-T531 Verify IA is enabled by default after upgrading from older PMM version @post-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
    async ({
      I, pmmSettingsPage,
    }) => {
      I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
      I.waitForVisible(pmmSettingsPage.fields.perconaAlertingSwitch, 30);
      I.dontSeeElement(pmmSettingsPage.communication.communicationSection);
      pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.perconaAlertingSwitchInput, 'on');
    },
  );
}

Scenario(
  'Verify Agents are RUNNING after Upgrade (API) [critical] @post-upgrade @post-client-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
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
  'Verify user can see Update widget [critical] @post-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
  async ({ I, homePage }) => {
    I.amOnPage(homePage.url);
    await homePage.verifyPostUpdateWidgetIsPresent();
  },
);

Scenario(
  'PMM-T262 Open PMM Settings page and verify DATA_RETENTION value is set to 2 days, Custom Resolution is still preserved after upgrade @ovf-upgrade @ami-upgrade @post-upgrade @pmm-upgrade',
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

// New Home dashboard for 2.32.0 doesn't have news panel on home dashboard
xScenario(
  'Verify user can see News Panel @post-upgrade @ami-upgrade @pmm-upgrade',
  async ({ I, homePage }) => {
    I.amOnPage(homePage.url);
    I.waitForVisible(homePage.fields.newsPanelTitleSelector, 30);
    I.waitForVisible(homePage.fields.newsPanelContentSelector, 30);
    const newsItems = await I.grabNumberOfVisibleElements(locate('article').inside(homePage.fields.newsPanelContentSelector));

    assert.ok(newsItems > 1, 'News Panel is empty');
  },
);

Scenario(
  'PMM-T424 Verify PT Summary Panel is available after Upgrade @post-upgrade @ovf-upgrade @ami-upgrade @post-client-upgrade @pmm-upgrade',
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
  'Verify Agents are RUNNING after Upgrade (UI) [critical] @ovf-upgrade @ami-upgrade @post-upgrade @post-client-upgrade @pmm-upgrade',
  async ({ I, pmmInventoryPage }) => {
    for (const service of Object.values(remoteInstancesHelper.upgradeServiceNames)) {
      if (service) {
        I.amOnPage(pmmInventoryPage.url);
        await I.scrollPageToBottom();
        await pmmInventoryPage.verifyAgentHasStatusRunning(service);
      }
    }
  },
);

Scenario(
  'Verify Agents are Running and Metrics are being collected Post Upgrade (UI) [critical] @ovf-upgrade @ami-upgrade @post-client-upgrade @post-upgrade @pmm-upgrade',
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

if (versionMinor > 14) {
  Data(clientDbServices)
    .Scenario(
      'Check Metrics for Client Nodes [critical] @ovf-upgrade @ami-upgrade @post-upgrade @post-client-upgrade @pmm-upgrade',
      async ({
        inventoryAPI,
        grafanaAPI,
        current,
      }) => {
        const metricName = current.metric;
        const { node_id } = await inventoryAPI.apiGetNodeInfoByServiceName(current.serviceType, current.name);
        const nodeName = await inventoryAPI.getNodeName(node_id);

        await grafanaAPI.checkMetricExist(metricName, {
          type: 'node_name',
          value: nodeName,
        });
      },
    );
}

Scenario(
  'Verify QAN has specific filters for Remote Instances after Upgrade (UI) @ovf-upgrade @ami-upgrade @post-client-upgrade @post-upgrade @pmm-upgrade',
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
  'Verify Metrics from custom queries for mysqld_exporter after upgrade (UI) @post-client-upgrade @post-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
  async ({ grafanaAPI }) => {
    const metricName = 'mysql_performance_schema_memory_summary_current_bytes';

    await grafanaAPI.checkMetricExist(metricName);
  },
);

Scenario(
  'Verify textfile collector extend metrics is still collected post upgrade (UI) @post-client-upgrade @post-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
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
  'PMM-T102 Verify Custom Prometheus Configuration File is still available at targets after Upgrade @ovf-upgrade @ami-upgrade @post-upgrade @pmm-upgrade',
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
    'Verify added Annotations at service level, also available post upgrade @ovf-upgrade @ami-upgrade @post-client-upgrade @post-upgrade @pmm-upgrade',
    async ({
      I, dashboardPage, current, inventoryAPI,
    }) => {
      const {
        serviceType, name, annotationName, dashboard,
      } = current;
      const { service_name } = await inventoryAPI.apiGetNodeInfoByServiceName(serviceType, name, 'ssl');
      const dashboardUrl = I.buildUrlWithParams(dashboard.split('?')[0], {
        service_name,
        from: 'now-60m',
      });

      I.amOnPage(dashboardUrl);
      dashboardPage.waitForDashboardOpened();
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
        I.amOnPage(dashboard);
        dashboardPage.waitForDashboardOpened();
        await adminPage.applyTimeRange('Last 5 minutes');
        await dashboardPage.applyFilter('Service Name', service);
        adminPage.performPageDown(5);
        await dashboardPage.expandEachDashboardRow();
        adminPage.performPageUp(5);
        await dashboardPage.verifyThereAreNoGraphsWithNA(3);
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

if (versionMinor >= 32) {
  Scenario(
    '@PMM-T1504 - The user is able to do a backup for MongoDB after upgrade'
    + ' @post-upgrade @pmm-upgrade',
    async ({
      locationsAPI, inventoryAPI, backupAPI, backupInventoryPage,
    }) => {
      const backupName = 'backup_after_update';

      const { location_id } = await locationsAPI.getLocationDetails(location.name);
      const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
      const backupId = await backupAPI.startBackup(backupName, service_id, location_id);

      await backupAPI.waitForBackupFinish(backupId);
      backupInventoryPage.openInventoryPage();
      backupInventoryPage.verifyBackupSucceeded(backupName);
    },
  );

  Scenario(
    '@PMM-T1505 @PMM-T971 - The scheduled job still exists and remains enabled after the upgrade @post-upgrade @pmm-upgrade',
    async ({ I, scheduledPage }) => {
      await scheduledPage.openScheduledBackupsPage();
      await I.waitForVisible(scheduledPage.elements.toggleByName(scheduleName));
      I.seeAttributesOnElements(scheduledPage.elements.toggleByName(scheduleName), { checked: true });

      // Verify settings for scheduled job
      I.seeTextEquals('Every 20 minutes', scheduledPage.elements.frequencyByName(scheduleName));
      I.seeTextEquals('MongoDB', scheduledPage.elements.scheduleVendorByName(scheduleName));
      I.seeTextEquals('Full', scheduledPage.elements.scheduleTypeByName(scheduleName));
      I.seeTextEquals(`${location.name} (S3)`, scheduledPage.elements.scheduleLocationByName(scheduleName));
      I.seeTextEquals('1 backup', scheduledPage.elements.retentionByName(scheduleName));

      // Disable schedule
      I.click(scheduledPage.buttons.enableDisableByName(scheduleName));
      await I.waitForVisible(scheduledPage.elements.toggleByName(scheduleName));
      I.seeAttributesOnElements(scheduledPage.elements.toggleByName(scheduleName), { checked: null });
    },
  ).retry(0);

  Scenario(
    '@PMM-T1506 - Storage Locations exist after upgrade @post-upgrade @pmm-upgrade',
    async ({ I, locationsPage }) => {
      locationsPage.openLocationsPage();
      I.waitForVisible(locationsPage.buttons.actionsMenuByName(location.name), 2);
      I.click(locationsPage.buttons.actionsMenuByName(location.name));
      I.seeElement(locationsPage.buttons.deleteByName(location.name));
      I.seeElement(locationsPage.buttons.editByName(location.name));
      I.seeTextEquals(locationsPage.locationType.s3, locationsPage.elements.typeCellByName(location.name));
      I.seeTextEquals(location.endpoint, locationsPage.elements.endpointCellByName(location.name));
    },
  );

  Scenario(
    '@PMM-T1503 PMM-T970 - The user is able to do a restore for MongoDB after the upgrade'
    + ' @post-upgrade @pmm-upgrade',
    async ({
      I, backupInventoryPage, restorePage, credentials,
    }) => {
      const replica = await I.getMongoClient({
        username: credentials.mongoReplicaPrimaryForBackups.username,
        password: credentials.mongoReplicaPrimaryForBackups.password,
        port: credentials.mongoReplicaPrimaryForBackups.port,
      });

      try {
        let collection = replica.db('test').collection('e2e');

        await I.say('I create test record in MongoDB after backup');
        await collection.insertOne({ number: 2, name: 'Anna' });

        backupInventoryPage.openInventoryPage();
        backupInventoryPage.startRestore(backupName);
        await restorePage.waitForRestoreSuccess(backupName);

        await I.say('I search for the record after MongoDB restored from backup');
        collection = replica.db('test').collection('e2e');
        const record = await collection.findOne({ number: 2, name: 'Anna' });

        I.assertEqual(record, null, `Was expecting to not have a record ${JSON.stringify(record, null, 2)} after restore operation`);
      } finally {
        await replica.close();
      }
    },
  ).retry(0);
}

Scenario('PMM-12587-1 Verify duplicate dashboards dont break after upgrade @pre-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
    async ({
             I, grafanaAPI, searchDashboardsModal
           }) => {

      const insightFolder = await grafanaAPI.lookupFolderByName(searchDashboardsModal.folders.insight.name);
      const experimentalFolder = await grafanaAPI.lookupFolderByName(searchDashboardsModal.folders.experimental.name);

      const resp1 = await grafanaAPI.createCustomDashboard('test-dashboard', insightFolder.id);
      const resp2 = await grafanaAPI.createCustomDashboard('test-dashboard', experimentalFolder.id);

      await I.writeFileSync('./dashboard.json', JSON.stringify({
        DASHBOARD1_UID: resp1.uid,
        DASHBOARD2_UID: resp2.uid
      }),false);

      //Check if file with Dashboard info is present.
      I.assertNotEqual(I.fileSize('./dashboard.json',false), 0, `Was expecting Dashboard info in the File, but its empty`);
    },);

Scenario(
    'PMM-12587-2 Verify duplicate dashboards dont break after upgrade @post-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade',
    async ({
             I, grafanaAPI, dashboardPage,
           }) => {
      const resp = JSON.parse(await I.readFileSync('./dashboard.json',false));

      const resp1 = await grafanaAPI.getDashboard(resp.DASHBOARD1_UID);
      const resp2 = await grafanaAPI.getDashboard(resp.DASHBOARD2_UID);

      //Trim leading '/' from response url
      const url1 = resp1.meta.url.replace(/^\/+/g, '');
      const url2 = resp2.meta.url.replace(/^\/+/g, '');

      I.amOnPage(url1);
      dashboardPage.waitForDashboardOpened();
      I.seeInCurrentUrl(url1);
      I.amOnPage(url2);
      dashboardPage.waitForDashboardOpened();
      I.seeInCurrentUrl(url2);
    },
);

// This test must be executed last
if (versionMinor >= 35) {
  Scenario(
    'PMM-T1189 - verify user is able to change password after upgrade @post-upgrade @pmm-upgrade',
    async ({ I, homePage }) => {
      const newPass = process.env.NEW_ADMIN_PASSWORD || 'admin1';

      await I.unAuthorize();
      await I.verifyCommand(`docker exec pmm-server change-admin-password ${newPass}`);
      await I.Authorize('admin', newPass);
      await homePage.open();
    },
  );
}
