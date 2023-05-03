Feature('QAN details');

const { adminPage } = inject();

const querySources = new DataTable(['querySource']);

querySources.add(['slowlog']);
// querySources.add(['perfschema']);

Before(async ({ I, qanPage, qanOverview }) => {
  await I.Authorize();
  I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-1h' }));
  qanOverview.waitForOverviewLoaded();
});

Scenario(
  'Verify Details section tabs @qan',
  async ({
    I, qanDetails, qanOverview, qanFilters,
  }) => {
    await qanFilters.applyFilter('ps-dev');
    qanOverview.selectRow(2);
    qanFilters.waitForFiltersToLoad();
    await within(qanDetails.root, () => {
      I.waitForVisible(qanDetails.buttons.close, 30);
      I.see('Details', qanDetails.getTabLocator('Details'));
      I.see('Example', qanDetails.getTabLocator('Example'));
      I.see('Explain', qanDetails.getTabLocator('Explain'));
      I.see('Tables', qanDetails.getTabLocator('Tables'));
    });
  },
);

Scenario(
  'PMM-T223 - Verify time metrics are AVG per query (not per second) @qan',
  async ({
    I, qanPage, qanOverview, qanFilters, qanDetails,
  }) => {
    const cellValue = qanDetails.getMetricsCellLocator('Query Time', 3);

    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { environment: 'ps-dev', from: 'now-1h', search: 'insert' }));
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    I.waitForVisible(cellValue, 30);
    await qanDetails.verifyAvqQueryCount(3600);
    await qanDetails.verifyAvgQueryTime(3600);
  },
);

Scenario(
  'PMM-T13 - Check Explain and Example for supported DBs @qan',
  async ({
    I, qanPage, qanOverview, qanFilters, qanDetails,
  }) => {
    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { environment: 'ps-dev', from: 'now-1h', search: 'insert' }));
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    qanDetails.checkExamplesTab();
    qanDetails.checkExplainTab();
  },
);

Scenario(
  'PMM-T13 - Check Explain and Example for supported DBs - md @qan',
  async ({
    I, qanPage, qanOverview, qanFilters, qanDetails,
  }) => {
    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { environment: 'md-dev', from: 'now-1h' }));
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    qanDetails.checkExamplesTab();
    qanDetails.checkExplainTab();
  },
);

Scenario(
  'PMM-T13 - Check Explain and Example for supported DBs - ps @qan',
  async ({
    I, qanPage, qanOverview, qanFilters, qanDetails,
  }) => {
    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { environment: 'ps-dev', from: 'now-1h' }));
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    qanDetails.checkExamplesTab();
    qanDetails.checkExplainTab();
  },
);

Scenario(
  'PMM-T13 - Check Explain and Example for supported DBs - pdpqsql @qan',
  async ({
    I, qanPage, qanOverview, qanFilters, qanDetails,
  }) => {
    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { environment: 'pdpgsql-dev', from: 'now-1h' }));
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    qanDetails.checkExamplesTab();
  },
);

Scenario(
  'PMM-T13 - Check Explain and Example for supported DBs - mongodb @qan',
  async ({
    I, qanOverview, qanFilters, qanDetails,
  }) => {
    await qanFilters.applyFilter('mongodb');
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    qanDetails.checkExamplesTab();
    qanDetails.checkExplainTab();
  },
);

Scenario(
  'PMM-T245 - Verify that user is able to close the Details section @qan',
  async ({
    I, qanOverview, qanFilters, qanDetails,
  }) => {
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    I.waitForElement(qanDetails.buttons.close, 30);
    I.click(qanDetails.buttons.close);
    I.waitForInvisible(qanDetails.buttons.close, 30);
    I.dontSeeElement(qanDetails.buttons.close);
  },
);

Scenario(
  'PMM-T144 Verify that Details tab is the only one available when total row is selected @qan',
  async ({
    I, qanPage, searchDashboardsModal, qanOverview, qanDetails,
  }) => {
    qanPage.waitForOpened();
    qanOverview.waitForOverviewLoaded();
    qanOverview.selectTotalRow();
    qanDetails.checkDetailsTab();
    I.dontSeeElement(qanDetails.getTabLocator('Examples'));
    I.dontSeeElement(qanDetails.getTabLocator('Explain'));
    I.dontSeeElement(qanDetails.getTabLocator('Tables'));
    I.dontSeeElement(qanDetails.getTabLocator('Plan'));
  },
);

Data(querySources).Scenario(
  '@PMM-T1667 Verify that SQL injection is filtered in placeholders on QAN tab @qan',
  async ({
    I, qanPage, adminPage, qanOverview, qanDetails, qanFilters, current,
  }) => {
    const { querySource } = current;
    const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;
    const port = '3307';
    const containerName = `ps_${querySource}_8.0`;
    const username = 'msandbox';

    const password = 'msandbox';
    const serviceName = `mysql_client_${querySource}`;
    const mysqlCommandPrefix = `docker exec ${containerName} mysql -h 127.0.0.1 -u ${username} -p${password} test --port ${port} -e`;

    await I.verifyCommand(`export PS_CONTAINER=${containerName} ; ${pmmFrameworkLoader} --setup-pmm-ps-integration --pmm2 --query-source=${querySource} --ps-version=8.0`);
    await I.verifyCommand(`docker exec ${containerName} pmm-admin add mysql --username=${username} --password=${password} --port=${port} --query-source=${querySource} --disable-queryexamples ${serviceName}`);

    await I.verifyCommand(`${mysqlCommandPrefix} "CREATE TABLE cities (ID int, Name varchar(255), Country varchar(255));"`);
    await I.verifyCommand(`${mysqlCommandPrefix} "INSERT INTO cities VALUES (1,'New York','USA'),(2,'Atlanta','USA'), (3,'Paris','France');"`);
    await I.verifyCommand(`${mysqlCommandPrefix} "SELECT * FROM test.cities WHERE ID = 1;"`);

    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-15m' }));
    qanOverview.waitForOverviewLoaded();
    qanOverview.waitForOverviewLoaded();
    await qanOverview.searchByValue('SELECT * FROM test.cities WHERE ID');
    await I.asyncWaitFor(async () => {
      I.click(qanOverview.buttons.refresh);

      return !(await I.grabNumberOfVisibleElements(qanOverview.elements.noResultTableText));
    }, 300);
    qanOverview.selectRowByText('select * from test.cities where id = ?');
    I.click(qanDetails.getTabLocator('Explain'));
    qanFilters.waitForFiltersToLoad();
    I.fillField(qanDetails.elements.firstPlaceholder, '1');
    I.waitForVisible(qanDetails.elements.explainTable);
    I.assertEqual(await I.grabNumberOfVisibleElements(locate('$query-analytics-details').find('$table-row')), 1, 'Explain is expected to have one row in a table, but found more');
  },
);
