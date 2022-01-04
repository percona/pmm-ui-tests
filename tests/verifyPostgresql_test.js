const pmmManagerCmd = 'bash /srv/pmm-qa/pmm-tests/pmm-framework.sh --pmm2';

Feature('Test functional related to the PostgreSQL');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1032 - Verify default PG queries are shipped with PMM',
  async ({ I, dashboardPage }) => {
    const metricNames = [
      'pg_replication_lag',
      'pg_postmaster_start_time_seconds',
      'pg_stat_user_tables_analyze_count',
      'pg_statio_user_tables_heap_blks_hit',
      'pg_database_size_bytes',
    ];
    const serviceName = 'PG-default-queries';

    await I.verifyCommand(`${pmmManagerCmd} --addclient=pdpgsql,1 --pdpgsql-version=13.4 --deploy-service-with-name ${serviceName}`);
    metricNames.forEach((metric) => {
      dashboardPage.checkMetricExist(metric, { type: 'service_name', value: serviceName });
    });
  },
);

Scenario(
  'PMM-T1102 - Verify last scrape of metrics from PostgreSQL',
  async ({ I, dashboardPage }) => {
    const metricName = 'pg_up';
    const serviceName = 'PG-service';

    await I.verifyCommand(`${pmmManagerCmd} --addclient=pdpgsql,1 --pdpgsql-version=13.4 --deploy-service-with-name ${serviceName}`);
    let response = await dashboardPage.checkMetricExist(metricName, { type: 'service_name', value: serviceName });
    const result = JSON.stringify(response.data.data.result);

    I.assertEqual(response.data.data.result, 1,
      `PostgreSQL ${serviceName} ${metricName} should be 1`);

    await I.verifyCommand(`docker stop ${serviceName}`);
    response = await dashboardPage.checkMetricExist(metricName, { type: 'service_name', value: serviceName });

    I.assertEqual(response.data.data.result, 0,
      `PostgreSQL ${serviceName} ${metricName} should be 1`);
  },
);
