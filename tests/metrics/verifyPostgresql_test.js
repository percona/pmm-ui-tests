const pmmManagerCmd = 'bash /srv/pmm-qa/pmm-tests/pmm-framework.sh --pmm2';

Feature('Test functional related to the PostgreSQL');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1032 - Verify default PG queries are shipped with PMM',
  async ({ I, grafanaAPI }) => {
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
      // make sure the method really  verifies metric existence
      grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: serviceName });
    });
    await I.verifyCommand(`${pmmManagerCmd} --cleanup-service ${serviceName}`);
  },
);

Scenario(
  'PMM-T1102 - Verify last scrape of metrics from PostgreSQL',
  async ({ I, grafanaAPI }) => {
    const metricName = 'pg_up';
    const serviceName = 'PG-service';

    await I.verifyCommand(`${pmmManagerCmd} --addclient=pdpgsql,1 --pdpgsql-version=13.4 --deploy-service-with-name ${serviceName}`);
    let response = await grafanaAPI.waitForMetric(metricName, { type: 'service_name', value: serviceName }, 30);
    const lastValue = Number(response.data.data.result[0].values.slice(-1)[0].slice(-1)[0]);

    I.assertEqual(lastValue, 1, `PostgreSQL ${serviceName} ${metricName} should be 1`);

    await I.verifyCommand(`docker stop ${serviceName}`);
    async function pgUpIsZero() {
      response = await grafanaAPI.waitForMetric(metricName, { type: 'service_name', value: serviceName }, 30);

      return Number(response.data.data.result[0].values.slice(-1)[0].slice(-1)[0]) === 0;
    }

    await I.asyncWaitFor(pgUpIsZero, 30);
    await I.say(`PostgreSQL ${serviceName} ${metricName} is 0`);
    await I.verifyCommand(`${pmmManagerCmd} --cleanup-service ${serviceName}`);
  },
);
