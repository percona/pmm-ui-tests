const assert = require('assert');

const connection = {
  host: '127.0.0.1',
  port: 5437,
  user: 'postgres',
  password: 'pass+this',
  database: 'postgres',
};

// Service Name is determined by value of env variable PGSQL_PGSM_CONTAINER and version PGSQL_VERSION
// default value for docker container is pgsql_pgsm, version is 14, port 5437 is accessible on the host system
// Service Name: ${PGSQL_PGSM_CONTAINER}_${PGSQL_VERSION}_service
// Docker Container Name: ${PGSQL_PGSM_CONTAINER}_${PGSQL_VERSION}

const version = process.env.PGSQL_VERSION ? `${process.env.PGSQL_VERSION}` : '14';
const container = process.env.PGSQL_PGSM_CONTAINER ? `${process.env.PGSQL_PGSM_CONTAINER}` : 'pgsql_pgsm';
const database = `pgsm${Math.floor(Math.random() * 99) + 1}`;
const pgsm_service_name = `${container}_${version}_service`;
const container_name = `${container}_${version}`;

const labels = [{ key: 'database', value: [`${database}`] }];

const filters = new DataTable(['filterSection', 'filterToApply']);

filters.add(['Command Type', 'SELECT']);
filters.add(['Command Type', 'INSERT']);
filters.add(['Command Type', 'UPDATE']);
filters.add(['Command Type', 'DELETE']);
filters.add(['Application Name', 'pmm-codeceptjs']);
filters.add(['Application Name', 'codeceptjs']);
filters.add(['Database', database]);

Feature('PMM + PGSM Integration Scenarios');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'Adding Load to Postgres test database and verifying PMM-Agent and PG_STAT_MONITOR QAN agent is in running status @not-ui-pipeline @pgsm-pmm-integration',
  async ({ I }) => {
    await I.pgExecuteQueryOnDemand('SELECT now();', connection);

    const output = await I.pgExecuteQueryOnDemand(`SELECT * FROM pg_database where datname= '${database}';`, connection);

    if (output.rows.length === 0) {
      await I.pgExecuteQueryOnDemand(`Create database ${database};`, connection);
    }

    connection.database = database;
    const sql = await I.verifyCommand('cat testdata/pgsql/pgsm_load.sql');

    await I.pgExecuteQueryOnDemand(sql, connection);
    connection.database = 'postgres';
    // wait for pmm-agent to push the execution as part of next bucket to clickhouse
    I.wait(60);
    await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "postgresql_pgstatmonitor_agent" | grep "Running"`);
  },
);

Scenario(
  'Verifying data in Clickhouse and comparing with PGSM output @not-ui-pipeline @pgsm-pmm-integration',
  async ({ I, qanAPI }) => {
    const toStart = new Date();
    // using 5 mins as time range hence multiplied 5 min to milliseconds value for
    const fromStart = new Date(toStart - (5 * 60000));
    const pgsm_output = await I.pgExecuteQueryOnDemand(`select query, queryid, planid, query_plan, calls, total_exec_time, mean_exec_time  from pg_stat_monitor where datname='${database}';`, connection);

    for (let i = 0; i < pgsm_output.rows.length; i++) {
      const response = await qanAPI.getMetricByFilterAPI(pgsm_output.rows[i].queryid, 'queryid', labels, fromStart.toISOString(), toStart.toISOString());
      // we do this conversion because clickhouse has values in micro seconds, while PGSM has in milliseconds.
      const total_exec_time = parseFloat((pgsm_output.rows[i].total_exec_time / 1000).toFixed(7));
      const average_exec_time = parseFloat((pgsm_output.rows[i].mean_exec_time / 1000).toFixed(7));
      const query_cnt = parseInt(pgsm_output.rows[i].calls, 10);
      const { query, queryid } = pgsm_output.rows[i];

      if (response.status !== 200) {
        I.say(`Expected queryid with id as ${queryid} and query as ${query} to have data in clickhouse but got response as ${response.code}`);
      } else {
        const clickhouse_sum = parseFloat((response.data.metrics.query_time.sum).toFixed(7));
        const clickhouse_avg = parseFloat((response.data.metrics.query_time.avg).toFixed(7));

        if (query !== 'SELECT version()' && query !== 'SELECT /* pmm-agent:pgstatmonitor */ version()') {
          assert.ok(clickhouse_sum === total_exec_time, `Expected Total Query Time Metrics to be same for query ${query} with id as ${queryid} found ${clickhouse_sum} on clickhouse while PGSM has ${total_exec_time}`);
          assert.ok(clickhouse_avg === average_exec_time, `Expected Average Query Time Metrics to be same for query ${query} with id as ${queryid} found ${clickhouse_avg} on clickhouse while PGSM has ${average_exec_time}`);
          assert.ok(response.data.metrics.query_time.cnt === query_cnt, `Expected Total Query Count Metrics to be same for query ${query} with id as ${queryid} found in clickhouse as ${response.data.metrics.query_time.cnt} while pgsm has value as ${query_cnt}`);
        }
      }
    }
  },
);

Data(filters).Scenario(
  'Verify the "Command type" filter for Postgres @not-ui-pipeline @pgsm-pmm-integration',
  async ({
    I, qanPage, qanOverview, qanFilters, current, adminPage,
  }) => {
    const serviceName = pgsm_service_name;
    const {
      filterSection, filterToApply, searchValue,
    } = current;

    I.amOnPage(qanPage.url);
    qanOverview.waitForOverviewLoaded();
    qanFilters.applyFilter(serviceName);
    qanFilters.applyFilter(database);
    I.waitForVisible(qanFilters.buttons.showSelected, 30);

    qanFilters.applyFilterInSection(filterSection, filterToApply);
  },
);

Scenario(
  'Verify Postgresql Dashboard Instance Summary has Data @not-ui-pipeline @pgsm-pmm-integration',
  async ({
    I, dashboardPage, adminPage,
  }) => {
    I.amOnPage(dashboardPage.postgresqlInstanceSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Service Name', pgsm_service_name);
    await dashboardPage.expandEachDashboardRow();
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(5);
    adminPage.performPageUp(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.postgresqlInstanceSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);
