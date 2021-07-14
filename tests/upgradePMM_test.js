const assert = require('assert');
const faker = require('faker');
const { generate } = require('generate-password');

const {
  remoteInstancesHelper, perconaServerDB,
} = inject();

const connection = perconaServerDB.defaultConnection;
const emptyPasswordSummary = 'MySQL users have empty passwords';
const failedCheckRowLocator = locate('tr').withChild(locate('td').withText(remoteInstancesHelper.upgradeServiceNames.mysql));
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
  I.setRequestTimeout(30000);
});

BeforeSuite(async ({ I, codeceptjsConfig }) => {
  const mysqlComposeConnection = {
    host: process.env.AMI_INSTANCE_IP || '127.0.0.1',
    port: connection.port,
    username: connection.username,
    password: connection.password,
  };

  perconaServerDB.connectToPS(mysqlComposeConnection);

  // Connect to MongoDB
  const mongoConnection = {
    host: process.env.AMI_INSTANCE_IP || codeceptjsConfig.config.helpers.MongoDBHelper.host,
    port: codeceptjsConfig.config.helpers.MongoDBHelper.port,
    username: codeceptjsConfig.config.helpers.MongoDBHelper.username,
    password: codeceptjsConfig.config.helpers.MongoDBHelper.password,
  };

  await I.mongoConnect(mongoConnection);
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
    const resp = await grafanaAPI.createCustomDashboard();

    await grafanaAPI.starDashboard(resp.id);
    await grafanaAPI.setHomeDashboard(resp.id);

    I.amOnPage('');
    dashboardPage.waitForDashboardOpened();
    dashboardPage.verifyMetricsExistence(['Custom Panel']);
    I.seeInCurrentUrl(resp.url);
  },
);

Scenario(
  'Verify user is able to set custom Settings like Data_retention, Resolution @pre-upgrade @ami-upgrade @pmm-upgrade',
  async ({ settingsAPI, I }) => {
    const body = {
      telemetry_enabled: true,
      metrics_resolutions: {
        hr: '3s',
        mr: '15s',
        lr: '30s',
      },
      data_retention: '172800s',
    };

    await settingsAPI.changeSettings(body, true);
    I.wait(10);
  },
);

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
  Scenario(
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
  Scenario(
    'Verify user has failed checks before upgrade @pre-upgrade @ami-upgrade @pmm-upgrade',
    async ({
      I, settingsAPI, databaseChecksPage, securityChecksAPI,
    }) => {
      const runChecks = locate('button').withText('Run DB checks');

      await perconaServerDB.dropUser();
      await perconaServerDB.createUser();
      await settingsAPI.changeSettings({ stt: true });
      // Run DB Checks from UI
      // disable check, change interval for a check, change interval settings
      if (versionMinor >= 16) {
        databaseChecksPage.runDBChecks();
        await securityChecksAPI.disableCheck('mysql_anonymous_users');
        await securityChecksAPI.changeCheckInterval('postgresql_version');
        await settingsAPI.setCheckIntervals({ ...settingsAPI.defaultCheckIntervals, standard_interval: '3600s' });
      } else {
        I.amOnPage(databaseChecksPage.oldUrl);
        I.waitForVisible(runChecks, 30);
        I.click(runChecks);
        I.waitForVisible(failedCheckRowLocator, 30);
      }

      // Check that there are failed checks
      await securityChecksAPI.verifyFailedCheckExists(emptyPasswordSummary);
      await securityChecksAPI.verifyFailedCheckExists(failedCheckMessage);

      // Silence mysql Empty Password failed check
      I.waitForVisible(failedCheckRowLocator, 30);
      I.click(failedCheckRowLocator.find('button').first());
    },
  );
}

Scenario(
  'PMM-T3 Verify user is able to Upgrade PMM version [blocker] @pmm-upgrade @ami-upgrade  ',
  async ({ I, homePage }) => {
    I.amOnPage(homePage.url);
    await homePage.upgradePMM(versionMinor);
  },
);

Scenario(
  'Run queries for MongoDB after upgrade @post-upgrade @ami-upgrade @pmm-upgrade',
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
    I.seeInCurrentUrl(grafanaAPI.customDashboard);
  },
);

if (versionMinor >= 13) {
  Scenario(
    'Verify user has failed checks after upgrade / STT on @post-upgrade @ami-upgrade @pmm-upgrade',
    async ({
      I, pmmSettingsPage, securityChecksAPI, databaseChecksPage,
    }) => {
      // Wait for 30 seconds to have latest check results
      I.wait(30);
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
}

if (versionMinor >= 16) {
  Scenario(
    'Verify disabled checks remain disabled after upgrade @post-upgrade @ami-upgrade @pmm-upgrade',
    async ({
      I, allChecksPage,
    }) => {
      const checkName = 'MySQL Anonymous Users';

      I.amOnPage(allChecksPage.url);
      I.waitForVisible(allChecksPage.buttons.disableEnableCheck(checkName));
      I.seeTextEquals('Enable', allChecksPage.buttons.disableEnableCheck(checkName));
      I.seeTextEquals('Disabled', allChecksPage.elements.statusCellByName(checkName));
    },
  );

  Scenario(
    'Verify silenced checks remain silenced after upgrade @post-upgrade @ami-upgrade @pmm-upgrade',
    async ({
      I, databaseChecksPage,
    }) => {
      I.amOnPage(databaseChecksPage.url);

      I.waitForVisible(failedCheckRowLocator, 30);
      I.dontSeeElement(failedCheckRowLocator.find('td').withText(emptyPasswordSummary));

      I.click(locate('$db-checks-failed-checks-toggle-silenced').find('label'));

      I.seeElement(failedCheckRowLocator.find('td').withText(emptyPasswordSummary));
      I.seeElement(failedCheckRowLocator.find('td').withText('Silenced'));
    },
  );

  Scenario(
    'Verify check intervals remain the same after upgrade @post-upgrade @ami-upgrade @pmm-upgrade',
    async ({
      I, allChecksPage,
    }) => {
      const checkName = 'PostgreSQL Version';

      I.amOnPage(allChecksPage.url);
      I.waitForVisible(allChecksPage.buttons.disableEnableCheck(checkName));
      I.seeTextEquals('Frequent', allChecksPage.elements.intervalCellByName(checkName));
    },
  );

  Scenario(
    'Verify settings for intervals remain the same after upgrade @post-upgrade @ami-upgrade @pmm-upgrade',
    async ({
      I, pmmSettingsPage,
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
  Scenario(
    'PMM-T577 Verify user can see IA alerts after upgrade @post-upgrade @ami-upgrade @pmm-upgrade',
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
  'PMM-T262 Open PMM Settings page and verify DATA_RETENTION value is set to 2 days, Custom Resolution is still preserved after upgrade @post-upgrade @pmm-upgrade',
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
    await pmmSettingsPage.verifySettingsValue(pmmSettingsPage.fields.lowInput, 30);
    await pmmSettingsPage.verifySettingsValue(pmmSettingsPage.fields.mediumInput, 15);
    await pmmSettingsPage.verifySettingsValue(pmmSettingsPage.fields.highInput, 3);
  },
);

Scenario(
  'Verify user can see News Panel @post-upgrade @ami-upgrade @pmm-upgrade  ',
  async ({ I, homePage }) => {
    I.amOnPage(homePage.url);
    I.waitForVisible(homePage.fields.newsPanelTitleSelector, 30);
    I.waitForVisible(homePage.fields.newsPanelContentSelector, 30);
    const newsItems = await I.grabNumberOfVisibleElements(`${homePage.fields.newsPanelContentSelector}/div`);

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
  'Verify Metrics from custom queries for mysqld_exporter after upgrade (UI) @post-upgrade @ami-upgrade @pmm-upgrade',
  async ({ dashboardPage }) => {
    const metricName = 'mysql_performance_schema_memory_summary_current_bytes';

    const response = await dashboardPage.checkMetricExist(metricName);
    const result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Custom Metrics ${metricName} Should be available but got empty ${result}`);
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
