const { SERVICE_TYPE } = require('../helper/constants');

Feature('PMM upgrade tests for settings and metrics');

const { dashboardPage } = inject();

const clientDbServices = new DataTable(['serviceType', 'name', 'metric', 'annotationName', 'dashboard', 'upgrade_service']);

clientDbServices.add([SERVICE_TYPE.MYSQL, 'ps_', 'mysql_global_status_max_used_connections', 'annotation-for-mysql', dashboardPage.mysqlInstanceSummaryDashboard.url, 'mysql_upgrade']);
clientDbServices.add([SERVICE_TYPE.POSTGRESQL, 'PGSQL_', 'pg_stat_database_xact_rollback', 'annotation-for-postgres', dashboardPage.postgresqlInstanceSummaryDashboard.url, 'pgsql_upgrade']);
clientDbServices.add([SERVICE_TYPE.MONGODB, 'mongodb_', 'mongodb_connections', 'annotation-for-mongo', dashboardPage.mongoDbInstanceSummaryDashboard.url, 'mongo_upgrade']);

Scenario(
  'Verify user is able to set custom Settings like Data_retention, Resolution @pre-settings-metrics-upgrade @pmm-upgrade',
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

Scenario(
  'PMM-T262 Open PMM Settings page and verify DATA_RETENTION value is set to 2 days, Custom Resolution is still preserved after upgrade @post-settings-metrics-upgrade @post-upgrade',
  async ({ I, pmmSettingsPage }) => {
    const advancedSection = pmmSettingsPage.sectionTabsList.advanced;
    const metricResolutionSection = pmmSettingsPage.sectionTabsList.metrics;

    I.amOnPage(pmmSettingsPage.url);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(advancedSection, pmmSettingsPage.fields.advancedButton);
    await pmmSettingsPage.verifySettingsValue(pmmSettingsPage.fields.dataRetentionInput, 2);
    await pmmSettingsPage.expandSection(
      metricResolutionSection,
      pmmSettingsPage.fields.metricsResolutionButton,
    );
    await pmmSettingsPage.verifySettingsValue(pmmSettingsPage.fields.lowInput, 60);
    await pmmSettingsPage.verifySettingsValue(pmmSettingsPage.fields.mediumInput, 60);
    await pmmSettingsPage.verifySettingsValue(pmmSettingsPage.fields.highInput, 30);
  },
);


Data(clientDbServices)
  .Scenario(
    'Check Metrics for Client Nodes [critical] @post-settings-metrics-upgrade @post-client-upgrade',
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

Scenario(
  'Verify Metrics from custom queries for mysqld_exporter after upgrade (UI) @post-client-upgrade @post-settings-metrics-upgrade',
  async ({ grafanaAPI }) => {
    const metricName = 'mysql_performance_schema_memory_summary_current_bytes';

    await grafanaAPI.checkMetricExist(metricName);
  },
);

Scenario(
  'Verify textfile collector extend metrics is still collected post upgrade (UI) @post-client-upgrade @post-settings-metrics-upgrade',
  async ({ grafanaAPI }) => {
    const metricName = 'node_role';

    await grafanaAPI.checkMetricExist(metricName);
  },
);

Scenario(
  'Verify Metrics from custom queries for postgres_exporter after upgrade (UI) @post-client-upgrade @post-settings-metrics-upgrade',
  async ({ grafanaAPI }) => {
    const metricName = 'pg_stat_user_tables_n_tup_ins';

    await grafanaAPI.checkMetricExist(metricName);
  },
);
