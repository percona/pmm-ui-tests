const assert = require('assert');

const shortCutTests = new DataTable(['type', 'dashboard', 'shortcutLink', 'filter']);

// shortCutTests.add(['Cluster', 'MongoDB Cluster Summary', 'graph/d/mongodb-cluster-summary/mongodb-cluster-summary', 'rs1']);
shortCutTests.add(['Replication Set', 'MySQL Replication Summary', 'graph/d/mysql-replicaset-summary/mysql-replication-summary', 'ps-repl1']);
shortCutTests.add(['Node Name', 'Node Summary', 'graph/d/node-instance-summary/node-summary?var-node_name=pmm-server', 'pmm-server']);
shortCutTests.add(['Service Name', 'MongoDB ReplSet Summary', 'graph/d/mongodb-replicaset-summary/mongodb-replset-summary', 'rs1']);

Feature('QAN filters').retry(1);
// filterToApply - filter witch we check, searchValue - value to get zero search result
const filters = new DataTable(['filterToApply', 'searchValue']);

filters.add(['SELECT', 'INSERT INTO']);
// FIXME: unskip when https://jira.percona.com/browse/PMM-11657 is fixed
// filters.add(['INSERT', 'SELECT']);
// filters.add(['UPDATE', 'DELETE']);
// filters.add(['DELETE', 'UPDATE']);

Before(async ({ I, qanPage, qanOverview }) => {
  await I.Authorize();
  I.amOnPage(`${qanPage.url}&orgId=1`);
  qanOverview.waitForOverviewLoaded();
});

Data(filters).Scenario(
  'PMM-T1054 + PMM-T1055 - Verify the "Command type" filter for Postgres @qan',
  async ({
    I, qanOverview, qanFilters, current,
  }) => {
    const environmentName = 'pdpgsql-dev';

    await qanFilters.applyFilter(environmentName);
    I.waitForVisible(qanFilters.buttons.showSelected, 30);

    await qanFilters.applyFilterInSection('Command Type', current.filterToApply);
    await qanOverview.searchByValue(current.searchValue);
    I.waitForVisible(qanOverview.elements.noResultTableText, 30);
    I.seeTextEquals(qanOverview.messages.noResultTableText, qanOverview.elements.noResultTableText);
  },
);

Scenario(
  'PMM-T175 - Verify user is able to apply filter that has dots in label @qan',
  async ({ I, qanOverview, qanFilters }) => {
    const serviceName = 'ps_8.0';

    const countBefore = await qanOverview.getCountOfItems();

    qanFilters.waitForFiltersToLoad();
    await qanFilters.applyFilter(serviceName);
    I.seeInCurrentUrl(`service_name=${serviceName}`);
    const countAfter = await qanOverview.getCountOfItems();

    assert.ok(countBefore !== countAfter, 'Query count was expected to change');
  },
);

Scenario(
  'PMM-T172 - Verify that selecting a filter updates the table data and URL @qan',
  async ({ I, qanOverview, qanFilters }) => {
    const environmentName = 'ps-dev';

    const countBefore = await qanOverview.getCountOfItems();

    await qanFilters.applyFilter(environmentName);
    I.seeInCurrentUrl(`environment=${environmentName}`);
    const countAfter = await qanOverview.getCountOfItems();

    assert.ok(countBefore !== countAfter, 'Query count was expected to change');
  },
);

Scenario(
  'PMM-T126 - Verify user is able to Reset All filters @qan',
  async ({ I, qanOverview, qanFilters }) => {
    const environmentName1 = 'ps-dev';
    const environmentName2 = 'pgsql-dev';

    const countBefore = await qanOverview.getCountOfItems();

    await qanFilters.applyFilter(environmentName1);
    await qanFilters.applyFilter(environmentName2);
    await qanOverview.waitForNewItemsCount(countBefore);
    const countAfter = await qanOverview.getCountOfItems();

    assert.ok(countAfter !== countBefore, 'Query count was expected to change');

    I.click(qanFilters.buttons.resetAll);
    I.waitForVisible(qanFilters.elements.disabledResetAll, 30);
    const countAfterReset = await qanOverview.getCountOfItems();

    assert.ok(countAfterReset >= countBefore, 'Query count wasn\'t expected to change');
  },
);

Scenario(
  'PMM-T125 - Verify user is able to Show only selected filter values and Show All filter values @qan',
  async ({ I, qanFilters }) => {
    const environmentName1 = 'ps-dev';
    const environmentName2 = 'pgsql-dev';

    await qanFilters.applyFilter(environmentName1);
    await qanFilters.applyFilter(environmentName2);
    I.waitForVisible(qanFilters.buttons.showSelected, 30);
    I.click(qanFilters.buttons.showSelected);
    await qanFilters.verifyCountOfFilterLinks(2, false);
    I.click(qanFilters.buttons.showSelected);
    await qanFilters.verifyCountOfFilterLinks(2, true);
  },
);

// Skipping because of a random failings
xScenario(
  'PMM-T123 - Verify User is able to search for DB types, Env and Cluster @qan',
  async ({ I, qanOverview, qanFilters }) => {
    const filters = [
      'postgres',
      'mysql',
      'pmm-server',
      'postgresql',
      'mongodb',
      'ps-dev',
      'ps-dev-cluster',
      'pgsql-repl1',
    ];

    I.waitForElement(qanFilters.fields.filterBy, 30);
    const countBefore = await qanOverview.getCountOfItems();

    for (const i in filters) {
      await qanFilters.applyFilter(filters[i]);
      await qanOverview.waitForNewItemsCount(countBefore);
      const countAfter = await qanOverview.getCountOfItems();
      const locator = qanFilters.getFilterLocator(filters[i]);

      assert.ok(countBefore !== countAfter, 'Query count was expected to change');

      I.forceClick(locator);
    }
  },
);

Scenario(
  'PMM-T269 Check All Filter Groups Exists in the Filter Section @qan',
  async ({ I, qanFilters }) => {
    for (const i in qanFilters.filterGroups) {
      I.fillField(qanFilters.fields.filterBy, qanFilters.filterGroups[i]);
      I.waitForVisible(qanFilters.getFilterSectionLocator(qanFilters.filterGroups[i]), 30);
      I.seeElement(qanFilters.getFilterSectionLocator(qanFilters.filterGroups[i]));
      I.clearField(qanFilters.fields.filterBy);
    }
  },
);

Scenario(
  'PMM-T191 - Verify Reset All and Show Selected filters @qan',
  async ({ I, qanFilters }) => {
    const environmentName1 = 'ps-dev';
    const environmentName2 = 'pgsql-dev';

    await qanFilters.applyFilter(environmentName1);
    await qanFilters.applyFilter(environmentName2);
    I.click(qanFilters.buttons.showSelected);
    await qanFilters.verifyCountOfFilterLinks(2, false);
    I.click(qanFilters.buttons.resetAll);
    I.waitForInvisible(qanFilters.elements.spinner, 30);
    await qanFilters.verifyCountOfFilterLinks(2, true);

    await qanFilters.applyFilter(environmentName1);
    I.click(qanFilters.buttons.showSelected);
    await qanFilters.verifyCountOfFilterLinks(1, false);
    await qanFilters.applyFilter(environmentName1);
    I.waitForInvisible(qanFilters.elements.spinner, 30);
    await qanFilters.verifyCountOfFilterLinks(1, true);
  },
);

Scenario('PMM-T190 - Verify user is able to see n/a filter @qan', async ({ I, qanFilters }) => {
  qanFilters.waitForFiltersToLoad();
  I.fillField(qanFilters.fields.filterBy, 'n/a');
  await qanFilters.verifyCountOfFilterLinks(0, true);
});

Scenario(
  'PMM-T390 - Verify that we show info message when empty result is returned @qan',
  async ({
    I, qanOverview, qanFilters, adminPage,
  }) => {
    const serviceName = 'ps_8.0';
    const db1 = 'postgres';
    const db2 = 'n/a';
    const section = 'Database';

    let count = qanOverview.getCountOfItems();

    await adminPage.applyTimeRange('Last 3 hour');
    qanOverview.waitForOverviewLoaded();
    await qanFilters.applyShowAllLinkIfItIsVisible(section);
    await qanFilters.applyFilterInSection(section, db1);
    count = await qanOverview.waitForNewItemsCount(count);
    await qanFilters.applyShowAllLinkIfItIsVisible(section);
    await qanFilters.applyFilterInSection(section, db2);
    count = await qanOverview.waitForNewItemsCount(count);
    await qanFilters.applyFilter(serviceName);
    await qanOverview.waitForNewItemsCount(count);
    await qanFilters.applyFilterInSection(section, db2);
    await within(qanOverview.root, () => {
      I.waitForText('No queries available for this combination of filters', 30);
    });
  },
);

Scenario(
  'PMM-T221 - Verify that all filter options are always visible (but some disabled) after selecting an item and % value is changed @qan',
  async ({
    I, adminPage, qanOverview, qanFilters,
  }) => {
    const serviceType = 'mysql';
    const serviceName = 'ps_8.0';

    // change to 2 days for apply ps_8.0 value in filter
    await adminPage.applyTimeRange('Last 2 days');
    qanOverview.waitForOverviewLoaded();
    const countBefore = await qanOverview.getCountOfItems();
    const percentageBefore = await qanFilters.getPercentage('Service Type', serviceType);

    const countOfFilters = await I.grabNumberOfVisibleElements(qanFilters.fields.filterCheckboxes);

    await qanFilters.applyFilter(serviceType);
    const countAfter = await qanOverview.getCountOfItems();

    assert.ok(countAfter !== countBefore, 'Query count was expected to change');

    await qanFilters.verifyCountOfFilterLinks(countOfFilters, false);
    await qanFilters.applyFilter(serviceName);
    const percentageAfter = await qanFilters.getPercentage('Service Type', serviceType);

    assert.ok(
      percentageAfter !== percentageBefore,
      'Percentage for filter Service Type was expected to change',
    );
  },
);

Data(shortCutTests).Scenario(
  'PMM-T436 PMM-T458 - Verify short-cut navigation from filters to related dashboards, '
    + 'Verify time interval is passed from QAN to dashboards via shortcut links @qan-test',
  async ({
    I, qanFilters, dashboardPage, current, adminPage, qanOverview, qanPage,
  }) => {
    const shortCutLink = current.shortcutLink;

    console.log(shortCutLink);
    const header = current.dashboard;
    const filterValue = current.filter;
    const timeRangeValue = 'from=now-3h&to=now';

    I.amOnPage(`${qanPage.url}&orgId=1`);
    await adminPage.applyTimeRange('Last 3 hours');
    qanOverview.waitForOverviewLoaded();
    qanFilters.waitForFiltersToLoad();

    I.fillField(qanFilters.fields.filterBy, filterValue);
    await qanFilters.verifyShortcutAttributes(shortCutLink, filterValue, timeRangeValue);

    I.amOnPage(shortCutLink);
    if (filterValue === 'pmm-server') {
      I.waitInUrl(shortCutLink.split('?var-')[0], 30);
      I.waitInUrl(shortCutLink.split('?var-')[1], 30);
    } else {
      I.waitInUrl(shortCutLink, 30);
    }

    await dashboardPage.checkNavigationBar(header);
  },
);

Scenario('PMM-T437 - Verify short-cut navigation for n/a items @qan', async ({ I, qanFilters }) => {
  qanFilters.waitForFiltersToLoad();
  qanFilters.checkLink('Cluster', 'dev-cluster', true);
  I.fillField(qanFilters.fields.filterBy, 'n/a');
  qanFilters.checkLink('Cluster', 'undefined', false);
  qanFilters.checkLink('Replication Set', 'undefined', false);
});
