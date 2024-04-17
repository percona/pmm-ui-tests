Feature('QAN details');

const { adminPage } = inject();

const querySources = new DataTable(['querySource']);

querySources.add(['slowlog']);
// querySources.add(['perfschema']);

const databaseEnvironments = new DataTable(['name']);

databaseEnvironments.add(['ps-single']);
databaseEnvironments.add(['pxc_node']);
databaseEnvironments.add(['pgsql_pgss_pmm']);
databaseEnvironments.add(['pdpgsql_pgsm_pmm']);
// databaseEnvironments.add(['md-dev']);
databaseEnvironments.add(['mongos']);

Before(async ({ I, queryAnalyticsPage }) => {
  await I.Authorize();
  I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-1h' }));
  queryAnalyticsPage.waitForLoaded();
});

Scenario(
  'Verify Details section tabs @qan',
  async ({
    I, queryAnalyticsPage,
  }) => {
    await queryAnalyticsPage.filters.selectFilter('pxc-dev-cluster');
    queryAnalyticsPage.data.selectRow(2);
    queryAnalyticsPage.waitForLoaded();
    for (const header of queryAnalyticsPage.data.labels.detailsHeaders) {
      I.waitForVisible(queryAnalyticsPage.queryDetails.buttons.tab(header), 5);
    }
  },
).retry(1);

Scenario(
  'PMM-T223 - Verify time metrics are AVG per query (not per second) @qan',
  async ({
    I, queryAnalyticsPage,
  }) => {
    I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { environment: 'dev', from: 'now-1h', search: 'insert' }));
    I.waitForElement(queryAnalyticsPage.data.elements.queryRows, 30);
    queryAnalyticsPage.data.selectRow(1);
    queryAnalyticsPage.waitForLoaded();
    I.waitForVisible(queryAnalyticsPage.queryDetails.elements.metricsCellDetailValue('Query Time', 3), 30);
    await queryAnalyticsPage.queryDetails.verifyAverageQueryCount(3600);
    await queryAnalyticsPage.queryDetails.verifyAverageQueryTime(3600);
  },
);

Data(databaseEnvironments).Scenario(
  'PMM-T13 - Check Explain and Example for supported DBs @qan',
  async ({
    I, queryAnalyticsPage, current,
  }) => {
    I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-1h', search: 'insert' }));
    queryAnalyticsPage.waitForLoaded();
    queryAnalyticsPage.filters.selectContainFilterInGroup(current.name, 'Service Name');
    I.waitForElement(queryAnalyticsPage.data.elements.queryRows, 30);
    queryAnalyticsPage.data.selectRow(1);
    queryAnalyticsPage.waitForLoaded();
    queryAnalyticsPage.queryDetails.checkExamplesTab();

    if (!current.name.includes('pgsql')) {
      queryAnalyticsPage.queryDetails.checkTab('Explain');
    }
  },
);

Scenario(
  'PMM-T1790 - Verify that there is any no error on Explains after switching between queries from different DB servers '
    + '@qan',
  async ({
    I, queryAnalyticsPage,
  }) => {
    I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-1h', search: 'insert' }));
    I.waitForElement(queryAnalyticsPage.data.elements.queryRows, 30);
    queryAnalyticsPage.data.selectRow(1);
    queryAnalyticsPage.waitForLoaded();
    queryAnalyticsPage.queryDetails.checkTab('Explain');
    await queryAnalyticsPage.filters.selectContainFilter('ps-single');
    await queryAnalyticsPage.filters.selectContainFilter('mongos');
    await queryAnalyticsPage.filters.selectContainFilter('pdpgsql_pgsm_pmm');
    I.waitForElement(queryAnalyticsPage.data.elements.queryRows, 30);
    queryAnalyticsPage.data.selectRow(1);

    // eslint-disable-next-line no-undef
    const foundErrorMessage = await tryTo(() => I.verifyPopUpMessage(
      'invalid GetActionRequest.ActionId: value length must be at least 1 runes',
      2,
    ));

    I.assertFalse(foundErrorMessage, 'Found unexpected error message!');
    I.waitForElement(queryAnalyticsPage.queryDetails.buttons.close, 30);
  },
);

Scenario(
  'PMM-T245 - Verify that user is able to close the Details section @qan',
  async ({
    I, queryAnalyticsPage,
  }) => {
    I.waitForElement(queryAnalyticsPage.data.elements.queryRows, 30);
    queryAnalyticsPage.data.selectRow(1);
    queryAnalyticsPage.waitForLoaded();
    I.waitForElement(queryAnalyticsPage.queryDetails.buttons.close, 30);
    I.click(queryAnalyticsPage.queryDetails.buttons.close);
    I.waitForInvisible(queryAnalyticsPage.queryDetails.buttons.close, 30);
    I.dontSeeElement(queryAnalyticsPage.queryDetails.buttons.close);
  },
);

Scenario(
  'PMM-T144 Verify that Details tab is the only one available when total row is selected @qan',
  async ({
    I, queryAnalyticsPage,
  }) => {
    queryAnalyticsPage.waitForLoaded();
    queryAnalyticsPage.data.selectTotalRow();
    queryAnalyticsPage.queryDetails.checkTab('Details');
    I.dontSeeElement(queryAnalyticsPage.queryDetails.buttons.tab('Examples'));
    I.dontSeeElement(queryAnalyticsPage.queryDetails.buttons.tab('Explain'));
    I.dontSeeElement(queryAnalyticsPage.queryDetails.buttons.tab('Tables'));
    I.dontSeeElement(queryAnalyticsPage.queryDetails.buttons.tab('Plan'));
  },
);

// Skip until https://jira.percona.com/browse/PMM-12218 is fixed
// Data(querySources).Scenario(
//   '@PMM-T1667 Verify that SQL injection is filtered in placeholders on QAN tab @qan',
//   async ({
//     I, qanPage, adminPage, qanOverview, qanDetails, qanFilters, current,
//   }) => {
//     const { querySource } = current;
//     const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;
//     const port = '3307';
//     const containerName = `ps_${querySource}_8.0`;
//     const username = 'msandbox';

//     const password = 'msandbox';
//     const serviceName = `mysql_client_${querySource}`;
//     const mysqlCommandPrefix = `docker exec ${containerName} mysql -h 127.0.0.1 -u ${username} -p${password} test --port ${port} -e`;

//     await I.verifyCommand(`export PS_CONTAINER=${containerName} ; ${pmmFrameworkLoader} --setup-pmm-ps-integration --pmm2 --query-source=${querySource} --ps-version=8.0`);
//     await I.verifyCommand(`docker exec ${containerName} pmm-admin add mysql --username=${username} --password=${password} --port=${port} --query-source=${querySource} --disable-queryexamples ${serviceName}`);

//     await I.verifyCommand(`${mysqlCommandPrefix} "CREATE TABLE cities (ID int, Name varchar(255), Country varchar(255));"`);
//     await I.verifyCommand(`${mysqlCommandPrefix} "INSERT INTO cities VALUES (1,'New York','USA'),(2,'Atlanta','USA'), (3,'Paris','France');"`);
//     await I.verifyCommand(`${mysqlCommandPrefix} "SELECT * FROM test.cities WHERE ID = 1;"`);

//     I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-15m' }));
//     qanOverview.waitForOverviewLoaded();
//     qanOverview.waitForOverviewLoaded();
//     await qanOverview.searchByValue('SELECT * FROM test.cities WHERE ID');
//     await I.asyncWaitFor(async () => {
//       I.click(qanOverview.buttons.refresh);

//       return !(await I.grabNumberOfVisibleElements(qanOverview.elements.noResultTableText));
//     }, 300);
//     qanOverview.selectRowByText('select * from test.cities where id = ?');
//     I.click(qanDetails.getTabLocator('Explain'));
//     qanFilters.waitForFiltersToLoad();
//     I.fillField(qanDetails.elements.firstPlaceholder, '1');
//     I.waitForVisible(qanDetails.elements.explainTable);
//     I.assertEqual(await I.grabNumberOfVisibleElements(locate('$query-analytics-details').find('$table-row')), 1, 'Explain is expected to have one row in a table, but found more');
//   },
// );
