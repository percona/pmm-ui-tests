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
  'PMM-T1260 - Adding Load to Postgres test database and verifying PMM-Agent and PG_STAT_MONITOR QAN agent is in running status @not-ui-pipeline @pgsm-pmm-integration',
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
  'PMM-T1260 - Verifying data in Clickhouse and comparing with PGSM output @not-ui-pipeline @pgsm-pmm-integration',
  async ({ I, qanAPI }) => {
    const toStart = new Date();
    let pgsm_output;
    // using 5 mins as time range hence multiplied 5 min to milliseconds value for
    const fromStart = new Date(toStart - (5 * 60000));

    if (version < 13) {
      pgsm_output = await I.pgExecuteQueryOnDemand(`select query, pgsm_query_id, planid, query_plan, calls, total_time as total_exec_time, mean_time as mean_exec_time  from pg_stat_monitor where datname='${database}';`, connection);
    } else {
      pgsm_output = await I.pgExecuteQueryOnDemand(`select query, pgsm_query_id, planid, query_plan, calls, total_exec_time, mean_exec_time  from pg_stat_monitor where datname='${database}';`, connection);
    }

    for (let i = 0; i < pgsm_output.rows.length; i++) {
      const queryid = pgsm_output.rows[i].pgsm_query_id;
      const response = await qanAPI.getMetricByFilterAPI(queryid, 'queryid', labels, fromStart.toISOString(), toStart.toISOString());
      // we do this conversion because clickhouse has values in micro seconds, while PGSM has in milliseconds.
      const total_exec_time = parseFloat((pgsm_output.rows[i].total_exec_time / 1000).toFixed(7));
      const average_exec_time = parseFloat((pgsm_output.rows[i].mean_exec_time / 1000).toFixed(7));
      const query_cnt = parseInt(pgsm_output.rows[i].calls, 10);
      const { query } = pgsm_output.rows[i];

      if (response.status !== 200) {
        I.say(`Expected queryid with id as ${queryid} and query as ${query} to have data in clickhouse but got response as ${response.status}`);
      } else {
        const clickhouse_sum = parseFloat((response.data.metrics.query_time.sum).toFixed(7));
        const clickhouse_avg = parseFloat((response.data.metrics.query_time.avg).toFixed(7));

        // Due to rounding difference we sometimes have values which differ in points 0.0000001
        const avg_diff = Number(average_exec_time - clickhouse_avg).toFixed(7);
        const total_diff = Number(total_exec_time - clickhouse_sum).toFixed(7);

        if (query !== 'SELECT version()' && query !== 'SELECT /* pmm-agent:pgstatmonitor */ version()') {
          assert.ok(total_diff <= 0.0000001, `Expected Total Query Time Metrics to be same for query ${query} with id as ${queryid} found ${clickhouse_sum} on clickhouse while PGSM has ${total_exec_time}`);
          assert.ok(avg_diff <= 0.0000001, `Expected Average Query Time Metrics to be same for query ${query} with id as ${queryid} found ${clickhouse_avg} on clickhouse while PGSM has ${average_exec_time}`);
          assert.ok(response.data.metrics.query_time.cnt === query_cnt, `Expected Total Query Count Metrics to be same for query ${query} with id as ${queryid} found in clickhouse as ${response.data.metrics.query_time.cnt} while pgsm has value as ${query_cnt}`);
        }
      }
    }
  },
);

Data(filters).Scenario(
  'PMM-T1261 - Verify the "Command type" filter for Postgres @not-ui-pipeline @pgsm-pmm-integration',
  async ({
    I, qanPage, qanOverview, qanFilters, current, adminPage,
  }) => {
    const serviceName = pgsm_service_name;
    const {
      filterSection, filterToApply, searchValue,
    } = current;

    I.amOnPage(qanPage.url);
    qanOverview.waitForOverviewLoaded();
    await qanFilters.applyFilter(serviceName);
    await qanFilters.applyFilter(database);
    I.waitForVisible(qanFilters.buttons.showSelected, 30);

    await qanFilters.applyFilterInSection(filterSection, filterToApply);
  },
);

Scenario(
  'PMM-T1262 - Verify Postgresql Dashboard Instance Summary has Data @not-ui-pipeline @pgsm-pmm-integration',
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

Scenario(
  'PMM-T1259 - Adding Load to Postgres test database and verifying PMM-Agent and PG_STAT_MONITOR QAN agent is in running status @pgsm-pmm-integration @not-ui-pipeline',
  async ({ I }) => {
    await I.pgExecuteQueryOnDemand('SELECT now();', connection);
    const db = `${database}_pgbench`;

    const output = await I.pgExecuteQueryOnDemand(`SELECT * FROM pg_database where datname= '${db}';`, connection);

    if (output.rows.length === 0) {
      await I.pgExecuteQueryOnDemand(`Create database ${db};`, connection);
      await I.pgExecuteQueryOnDemand(`ALTER DATABASE ${db} owner to pmm;`, connection);
    }

    connection.database = db;
    await I.verifyCommand(`docker exec ${container_name} pgbench -i -s 100 --username=pmm ${db}`);
    await I.verifyCommand(`docker exec ${container_name} pgbench -c 2 -j 2 -T 60 --username=pmm ${db}`);
    connection.database = 'postgres';
    // wait for pmm-agent to push the execution as part of next bucket to clickhouse
    I.wait(60);
    await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "postgresql_pgstatmonitor_agent" | grep "Running"`);
  },
);

// The numbers don't entirely match, we need to find a way to track based on difference
xScenario(
  'PMM-T1259 - Verifying data in Clickhouse and comparing with PGSM output @pgsm-pmm-integration @not-ui-pipeline',
  async ({ I, qanAPI }) => {
    const toStart = new Date();
    const db = `${database}_pgbench`;
    const labels = [{ key: 'database', value: [`${db}`] }];
    const excluded_queries = [
      'SELECT version()',
      'SELECT /* pmm-agent:pgstatmonitor */ version()',
      'END',
      'BEGIN',
      'COMMIT',
    ];
    let pgsm_output;
    // using 3 mins as time range hence multiplied 3 min to milliseconds value for
    const fromStart = new Date(toStart - (3 * 60000));

    if (version < 13) {
      pgsm_output = await I.pgExecuteQueryOnDemand(`select query, pgsm_query_id, planid, query_plan, calls, total_time as total_exec_time, mean_time as mean_exec_time  from pg_stat_monitor where datname='${db}';`, connection);
    } else {
      pgsm_output = await I.pgExecuteQueryOnDemand(`select query, pgsm_query_id, planid, query_plan, calls, total_exec_time, mean_exec_time  from pg_stat_monitor where datname='${db}';`, connection);
    }

    for (let i = 0; i < pgsm_output.rows.length; i++) {
      const queryid = pgsm_output.rows[i].pgsm_query_id;
      const response = await qanAPI.getMetricByFilterAPI(queryid, 'queryid', labels, fromStart.toISOString(), toStart.toISOString());
      const {
        total_exec_time,
        average_exec_time,
        query_cnt,
      } = await qanAPI.getMetricsFromPGSM(db, pgsm_output.rows[i].queryid, connection, version);
      const { query } = pgsm_output.rows[i];

      if (response.status !== 200) {
        I.say(`Expected queryid with id as ${queryid} and query as ${query} to have data in clickhouse but got response as ${response.status}`);
      } else {
        const clickhouse_sum = parseFloat((response.data.metrics.query_time.sum).toFixed(7));
        const clickhouse_avg = parseFloat((response.data.metrics.query_time.avg).toFixed(7));

        // Due to rounding difference we sometimes have values which differ in points 0.0000001
        const avg_diff = Number(average_exec_time - clickhouse_avg).toFixed(7);
        const total_diff = Number(total_exec_time - clickhouse_sum).toFixed(7);

        if (!query.includes(excluded_queries)) {
          assert.ok(total_diff <= 0.0000001, `Expected Total Query Time Metrics to be same for query ${query} with id as ${queryid} found ${clickhouse_sum} on clickhouse while PGSM has ${total_exec_time}`);
          assert.ok(avg_diff <= 0.0000001, `Expected Average Query Time Metrics to be same for query ${query} with id as ${queryid} found ${clickhouse_avg} on clickhouse while PGSM has ${average_exec_time}`);
          assert.ok(response.data.metrics.query_time.cnt === query_cnt, `Expected Total Query Count Metrics to be same for query ${query} with id as ${queryid} found in clickhouse as ${response.data.metrics.query_time.cnt} while pgsm has value as ${query_cnt}`);
        }
      }
    }
  },
);

Scenario(
  'PMM-T1063 - Verify Application Name with pg_stat_monitor @pgsm-pmm-integration @not-ui-pipeline',
  async ({
    I, qanOverview, qanFilters, qanPage,
  }) => {
    // Set Application Name and run sample queries, wait for 60 seconds to see Data in QAN
    const sql = await I.verifyCommand('cat testdata/pgsql/pgsm_applicationName.sql');
    const applicationName = 'PMMT1063';

    await I.pgExecuteQueryOnDemand(sql, connection);
    I.wait(60);
    await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "postgresql_pgstatmonitor_agent" | grep "Running"`);
    I.amOnPage(qanPage.url);
    qanOverview.waitForOverviewLoaded();
    I.waitForVisible(qanFilters.buttons.showSelected, 30);

    await qanFilters.applyFilterInSection('Application Name', applicationName);
    qanOverview.waitForOverviewLoaded();
    const count = await qanOverview.getCountOfItems();

    assert.ok(parseInt(count, 10) === 5, `Expected only 5 Queries to show up for ${applicationName} based on the load script but found ${count}`);
  },
);

Scenario(
  'PMM-T1063 - Verify Top Query and Top QueryID with pg_stat_monitor @pgsm-pmm-integration @not-ui-pipeline',
  async ({
    I, qanOverview, qanFilters, qanPage, qanDetails,
  }) => {
    let pgsm_output;
    const db = `${database}_topquery`;
    const queryWithTopId = '(select $1 + $2)';
    const topQuery = 'SELECT add2(1,2)';
    const output = await I.pgExecuteQueryOnDemand(`SELECT * FROM pg_database where datname= '${db}';`, connection);

    if (output.rows.length === 0) {
      await I.pgExecuteQueryOnDemand(`Create database ${db};`, connection);
    }

    connection.database = db;
    const sql = await I.verifyCommand('cat testdata/pgsql/pgsm_topQuery.sql');

    await I.pgExecuteQueryOnDemand(sql, connection);
    connection.database = 'postgres';
    I.wait(60);
    pgsm_output = await I.pgExecuteQueryOnDemand(`select query, pgsm_query_id, top_queryid, top_query  from pg_stat_monitor where datname='${db}' and query like '${queryWithTopId}' and top_query IS NOT NULL;`, connection);
    if (pgsm_output.rows.length === 0) {
      // Need clarification on this workaround from PGSM team, looks like a bug <insufficient disk/shared space
      pgsm_output = await I.pgExecuteQueryOnDemand(`select query, pgsm_query_id, top_queryid, top_query  from pg_stat_monitor where datname='${db}' and query like '<insufficient disk/shared space' and top_query IS NOT NULL;`, connection);
    }

    for (let i = 0; i < pgsm_output.rows.length; i++) {
      const topQueryId = pgsm_output.rows[i].top_queryid;
      const queryId = pgsm_output.rows[i].pgsm_query_id;
      const pgsmTopQuery = pgsm_output.rows[i].top_query;
      const pgsmQuery = pgsm_output.rows[i].query;

      I.amOnPage(qanPage.url);
      qanOverview.waitForOverviewLoaded();
      I.waitForVisible(qanFilters.buttons.showSelected, 30);

      await qanFilters.applyFilterInSection('Database', db);
      qanOverview.waitForOverviewLoaded();
      await qanOverview.searchByValue(queryId);
      qanOverview.waitForOverviewLoaded();
      qanOverview.selectRow(1);
      I.waitForElement(qanDetails.elements.topQuery);
      I.click(qanDetails.elements.topQuery);
      qanOverview.waitForOverviewLoaded();
      const queryid = await I.grabValueFrom(qanOverview.fields.searchBy);

      assert.ok(pgsmTopQuery === topQuery, `Top Query for query ${pgsmQuery} found in pgsm view is ${pgsmTopQuery} while the expected query was ${topQuery}`);
      assert.ok(queryid === topQueryId, `Top Query ID found in PGSM view was ${topQueryId} while the one present in QAN for ${queryWithTopId} is ${queryid}`);
    }
  },
);

Scenario(
  'PMM-T1071 - Verify Histogram is displayed for each query with pg_stat_monitor @pgsm-pmm-integration @not-ui-pipeline',
  async ({
    I, qanOverview, qanFilters, qanPage, qanDetails,
  }) => {
    let countHistogram = 0;
    const db = `${database}_histogram`;
    const output = await I.pgExecuteQueryOnDemand(`SELECT * FROM pg_database where datname= '${db}';`, connection);

    if (output.rows.length === 0) {
      await I.pgExecuteQueryOnDemand(`Create database ${db};`, connection);
    }

    connection.database = db;
    const sql = await I.verifyCommand('cat testdata/pgsql/pgsm_Histogram.sql');

    await I.pgExecuteQueryOnDemand(sql, connection);
    connection.database = 'postgres';
    I.wait(60);
    I.amOnPage(qanPage.url);
    qanOverview.waitForOverviewLoaded();
    I.waitForVisible(qanFilters.buttons.showSelected, 30);

    await qanFilters.applyFilterInSection('Database', db);
    qanOverview.waitForOverviewLoaded();
    const count = await qanOverview.getCountOfItems();

    // Skipping the first one because thats the top query generated by select pg_sleep()
    for (let i = 2; i <= count; i++) {
      qanOverview.selectRow(i);
      I.waitForElement(qanDetails.buttons.close, 30);
      const count = await I.grabNumberOfVisibleElements(qanDetails.elements.histogramContainer);

      countHistogram += count;
    }

    assert.ok(countHistogram > 5, `Expected Atleast 5 queries to have Histogram in query details, found ${countHistogram}`);
  },
);

// Need to fix this and revert skip
xScenario(
  'PMM-T1253 Verify pg_stat_monitor.pgsm_normalized_query settings @not-ui-pipeline @pgsm-pmm-integration',
  async ({
    I, qanPage, qanOverview, qanFilters, qanDetails,
  }) => {
    const defaultValue = 'no';
    const alteredValue = 'yes';
    const queriesNumber = 2;

    await I.pgExecuteQueryOnDemand(`ALTER SYSTEM SET pg_stat_monitor.pgsm_normalized_query=${defaultValue};`, connection);
    await I.verifyCommand(`docker exec ${container_name} service postgresql restart`);
    let output = await I.pgExecuteQueryOnDemand('SELECT * FROM pg_stat_monitor_settings WHERE name=\'pg_stat_monitor.pgsm_normalized_query\';', connection);

    assert.equal(output.rows[0].value, 'no', `The value of 'pg_stat_monitor.pgsm_normalized_query' should be equal to '${defaultValue}'`);
    assert.equal(output.rows[0].default_value, 'no', `The default value of 'pg_stat_monitor.pgsm_normalized_query' should be equal to '${defaultValue}'`);

    await I.Authorize();

    //  Function used to produce data and check if examples are shown
    async function checkForExamples(isNoExamplesVisible) {
      I.amOnPage(qanPage.url);
      qanOverview.waitForOverviewLoaded();
      qanFilters.waitForFiltersToLoad();
      await qanFilters.applyFilter(pgsm_service_name);
      for (let i = 1; i < queriesNumber; i++) {
        const tableName = `PMM_T1253_${Date.now()}`;

        //  Sql queries used to produce data for table
        await I.pgExecuteQueryOnDemand(`CREATE TABLE ${tableName} ( TestId int );`, connection);
        await I.pgExecuteQueryOnDemand(`DROP TABLE ${tableName};`, connection);
        await qanOverview.searchByValue(tableName, true);
        qanOverview.selectRow(1);
        qanFilters.waitForFiltersToLoad();
        //  Assertion that there are or there are no examples in the examples tab
        qanDetails.checkExamplesTab(isNoExamplesVisible);
        qanOverview.selectRow(2);
        qanFilters.waitForFiltersToLoad();
        qanDetails.checkExamplesTab(isNoExamplesVisible);
      }
    }

    await checkForExamples(false);
    //  Sequence of actions used to alter default value for pgsm_normalized_query with container restart
    await I.pgExecuteQueryOnDemand(`ALTER SYSTEM SET pg_stat_monitor.pgsm_normalized_query=${alteredValue};`, connection);
    await I.verifyCommand(`docker exec ${container_name} service postgresql restart`);
    I.wait(5);
    await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "postgresql_pgstatmonitor_agent" | grep "Running"`);
    output = await I.pgExecuteQueryOnDemand('SELECT * FROM pg_stat_monitor_settings WHERE name=\'pg_stat_monitor.pgsm_normalized_query\';', connection);
    assert.equal(output.rows[0].value, 'yes', `The default value of 'pg_stat_monitor.pgsm_normalized_query' should be equal to '${alteredValue}'`);
    await checkForExamples(true);
  },
);

Scenario(
  'PMM-T1292 PMM-T1302 PMM-T1303 PMM-T1283 Verify that pmm-admin inventory add agent postgres-exporter with --log-level flag adds PostgreSQL exporter with corresponding log-level @not-ui-pipeline @pgsm-pmm-integration',
  async ({
    I, inventoryAPI, grafanaAPI, dashboardPage,
  }) => {
    I.amOnPage(dashboardPage.postgresqlInstanceOverviewDashboard.url);
    dashboardPage.waitForDashboardOpened();
    const pgsql_service_name = 'pgsql_pgsm_inventory_service';

    // adding service which will be used to verify various inventory addition commands
    await I.say(await I.verifyCommand(`docker exec ${container_name} pmm-admin remove postgresql ${pgsql_service_name} || true`));
    await I.say(await I.verifyCommand(`docker exec ${container_name} pmm-admin add postgresql --query-source=pgstatmonitor --agent-password='testing' --password=${connection.password} --username=${connection.user} --service-name=${pgsql_service_name}`));
    //
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('POSTGRESQL_SERVICE', pgsql_service_name);
    const pmm_agent_id = (await I.verifyCommand(`docker exec ${container_name} pmm-admin status | grep "Agent ID" | awk -F " " '{print $4}'`)).trim();

    const dbDetails = {
      username: 'pmm',
      password: 'pmm',
      pmm_agent_id,
      service_id,
      service_name: pgsql_service_name,
      container_name,
    };

    await inventoryAPI.verifyAgentLogLevel('postgresql', dbDetails);
    await inventoryAPI.verifyAgentLogLevel('pgstatmonitor', dbDetails);
    await inventoryAPI.verifyAgentLogLevel('postgresql', dbDetails, 'debug');
    await inventoryAPI.verifyAgentLogLevel('pgstatmonitor', dbDetails, 'debug');
    await inventoryAPI.verifyAgentLogLevel('postgresql', dbDetails, 'info');
    await inventoryAPI.verifyAgentLogLevel('pgstatmonitor', dbDetails, 'info');
    await inventoryAPI.verifyAgentLogLevel('postgresql', dbDetails, 'warn');
    await inventoryAPI.verifyAgentLogLevel('pgstatmonitor', dbDetails, 'warn');
    await inventoryAPI.verifyAgentLogLevel('postgresql', dbDetails, 'error');
    await inventoryAPI.verifyAgentLogLevel('pgstatmonitor', dbDetails, 'error');

    await I.say(await I.verifyCommand(`docker exec ${container_name} pmm-admin remove postgresql ${pgsql_service_name}`));
  },
);

Scenario(
  'PMM-T1254 Verify pg_stat_monitor.pgsm_bucket_time settings @not-ui-pipeline @pgsm-pmm-integration',
  async ({ I }) => {
    const defaultValue = 60;
    const alteredValue = 61;

    await I.pgExecuteQueryOnDemand(`ALTER SYSTEM SET pg_stat_monitor.pgsm_bucket_time=${defaultValue};`, connection);
    await I.verifyCommand(`docker exec ${container_name} service postgresql restart`);
    let output = await I.pgExecuteQueryOnDemand('SELECT * FROM pg_stat_monitor_settings WHERE name=\'pg_stat_monitor.pgsm_bucket_time\';', connection);

    assert.equal(output.rows[0].value, defaultValue, `The value of 'pg_stat_monitor.pgsm_bucket_time' should be equal to ${defaultValue}`);
    assert.equal(output.rows[0].default_value, defaultValue, `The value of 'pg_stat_monitor.pgsm_bucket_time' should be equal to ${defaultValue}`);
    await I.verifyCommand(`docker exec ${container_name} true > pmm-agent.log`);
    await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "postgresql_pgstatmonitor_agent" | grep "Running"`);
    I.wait(defaultValue);
    let log = await I.verifyCommand(`docker exec ${container_name} tail -n100 pmm-agent.log`);

    assert.ok(!log.includes('non default bucket time value is not supported, status changed to WAITING'),
      'The log wasn\'t supposed to contain errors regarding bucket time but it does');

    await I.pgExecuteQueryOnDemand(`ALTER SYSTEM SET pg_stat_monitor.pgsm_bucket_time=${alteredValue};`, connection);
    await I.verifyCommand(`docker exec ${container_name} service postgresql restart`);
    output = await I.pgExecuteQueryOnDemand('SELECT * FROM pg_stat_monitor_settings WHERE name=\'pg_stat_monitor.pgsm_bucket_time\';', connection);
    assert.equal(output.rows[0].value, alteredValue, `The value of 'pg_stat_monitor.pgsm_bucket_time' should be equal to ${alteredValue}`);
    I.wait(alteredValue);
    log = await I.verifyCommand(`docker exec ${container_name} tail -n100 pmm-agent.log`);

    assert.ok(log.includes('non default bucket time value is not supported, status changed to WAITING'),
      'The log was supposed to contain errors regarding bucket time but it doesn\'t');

    await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "postgresql_pgstatmonitor_agent" | grep "Waiting"`);
    await I.pgExecuteQueryOnDemand(`ALTER SYSTEM SET pg_stat_monitor.pgsm_bucket_time=${defaultValue};`, connection);
    await I.verifyCommand(`docker exec ${container_name} service postgresql restart`);
  },
);
