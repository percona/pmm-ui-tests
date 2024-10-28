const assert = require('assert');
const { NODE_TYPE, SERVICE_TYPE } = require('./helper/constants');

const { remoteInstancesHelper, psMySql, pmmSettingsPage, dashboardPage, databaseChecksPage, locationsAPI } = inject();

const alertManager = {
  alertmanagerURL: 'http://192.168.0.1:9093',
  alertmanagerRules: pmmSettingsPage.alertManager.rule2,
};

const clientDbServices = new DataTable(['serviceType', 'name', 'metric', 'annotationName', 'dashboard', 'upgrade_service']);

clientDbServices.add([SERVICE_TYPE.MYSQL, 'ps_', 'mysql_global_status_max_used_connections', 'annotation-for-mysql', dashboardPage.mysqlInstanceSummaryDashboard.url, 'mysql_upgrade']);
clientDbServices.add([SERVICE_TYPE.POSTGRESQL, 'PGSQL_', 'pg_stat_database_xact_rollback', 'annotation-for-postgres', dashboardPage.postgresqlInstanceSummaryDashboard.url, 'pgsql_upgrade']);
// eslint-disable-next-line max-len
clientDbServices.add([SERVICE_TYPE.MONGODB, 'mongodb_', 'mongodb_connections', 'annotation-for-mongo', dashboardPage.mongoDbInstanceSummaryDashboard.url, 'mongo_upgrade']);

const connection = psMySql.defaultConnection;
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
        const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MYSQL, psServiceName);
        const { alert_id } = (await advisorsAPI.getFailedChecks(service_id))
          .find(({ summary }) => summary === failedCheckMessage);

        await advisorsAPI.toggleChecksAlert(alert_id);
      } else {
        I.waitForVisible(failedCheckRowLocator, 30);
        I.click(failedCheckRowLocator.find('button').withText('Silence'));
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
        node_type: NODE_TYPE.REMOTE,
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

Scenario(
  'Setup Prometheus Alerting with external Alert Manager via API PMM-Settings @pre-upgrade @pmm-upgrade',
  async ({ settingsAPI }) => {
    await settingsAPI.changeSettings(alertManager);
  },
);

Scenario(
  'PMM-T3 Verify user is able to Upgrade PMM version [blocker] @pmm-upgrade @ovf-upgrade @ami-upgrade  ',
  async ({ I, homePage }) => {
    I.amOnPage(homePage.url);
    await homePage.upgradePMM(versionMinor);
    I.saveScreenshot('@PMM-T3');
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
  'PMM-T268 - Verify Failed check singlestats after upgrade from old versions @post-upgrade @pmm-upgrade',
  async ({
    I, homePage,
  }) => {
    await homePage.open();
    I.dontSeeElement(homePage.fields.sttDisabledFailedChecksPanelSelector, 15);
    I.waitForVisible(homePage.fields.failedChecksPanelContent, 30);
  },
);

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
      const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MYSQL, psServiceName);

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
    I, queryAnalyticsPage,
  }) => {
    I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-5m' }));
    queryAnalyticsPage.waitForLoaded();

    // Checking that Cluster filters are still in QAN after Upgrade
    for (const name of Object.keys(remoteInstancesHelper.upgradeServiceNames)) {
      if (remoteInstancesHelper.qanFilters.includes(name)) {
        queryAnalyticsPage.waitForLoaded();
        I.waitForVisible(queryAnalyticsPage.filters.fields.filterByName(name), 30);
        I.seeElement(queryAnalyticsPage.filters.fields.filterByName(name));
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
