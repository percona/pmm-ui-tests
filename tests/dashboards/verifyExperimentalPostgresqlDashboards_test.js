const assert = require('assert');

Feature('Test PostgreSQL Experimental Dashboards');

Before(async ({ I }) => {
  await I.Authorize();
});

const panels = new DataTable(['panelName', 'dashboardType', 'dashboardName', 'dashboard']);

panels.add(['Disk Space Total', 'singleNode', 'Disk Details', 'osDiskDetails']);
panels.add(['Disk Reads', 'singleNode', 'Disk Details', 'osDiskDetails']);
panels.add(['Disk Writes', 'singleNode', 'Disk Details', 'osDiskDetails']);
panels.add(['Total RAM', 'singleNode', 'Memory Details', 'osMemoryDetails']);
panels.add(['Virtual Memory Total', 'multipleNodes', 'Nodes Overview', 'osNodesOverview']);
panels.add(['Monitored Nodes', 'multipleNodes', 'Nodes Overview', 'osNodesOverview']);
panels.add(['Total Virtual CPUs', 'multipleNodes', 'Nodes Overview', 'osNodesOverview']);

Data(panels).Scenario(
  '@PMM-T1565 Verify ability to access OS dashboards with correct filter setup from Home Dashboard @nightly @dashboards',
  async ({
    I, current, dashboardPage, homePage,
  }) => {
    const {
      panelName, dashboardType, dashboardName, dashboard,
    } = current;

    await homePage.open();

    const expectedDashboard = dashboardPage[dashboard];

    I.click(dashboardPage.fields.openFiltersDropdownLocator('Node Name'));
    const nodeNames = await I.grabTextFromAll(dashboardPage.fields.allFilterDropdownOptions);

    I.click(dashboardPage.fields.filterDropdownOptionsLocator(nodeNames[0]));
    I.click(dashboardPage.fields.filterDropdownOptionsLocator(nodeNames[1]));
    I.click(dashboardPage.fields.refresh);
    dashboardPage.waitForDataLoaded();
    const expectedNodeName = dashboardType === 'singleNode'
      ? nodeNames.sort()[0]
      : await I.grabTextFrom(dashboardPage.fields.openFiltersDropdownLocator('Node Name'));

    I.click(dashboardPage.fields.clickablePanel(panelName));
    I.switchToNextTab();
    window.localStorage.setItem('percona.showTour', false);
    I.refreshPage();
    I.waitForElement(`//span[text()="${dashboardName}"]`, 60);
    I.seeInCurrentUrl(expectedDashboard.clearUrl);
    await I.assertEqual(await I.grabTextFrom(dashboardPage.fields.openFiltersDropdownLocator('Node Name')), expectedNodeName);
    await dashboardPage.expandEachDashboardRow();

    dashboardPage.verifyMetricsExistence(expectedDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA(expectedDashboard.naElements);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(expectedDashboard.noDataElements);
  },
);

Scenario(
  'PMM-T1365 Verify PostgreSQL Vacuum monitoring dashboard @dashboards @experimental',
  async ({
    I, experimentalPostgresqlDashboardsPage,
  }) => {
    await I.amOnPage(experimentalPostgresqlDashboardsPage.vacuumDashboardPostgres.url);
    await experimentalPostgresqlDashboardsPage.selectServiceName('pgsql_vacuum_db');
    await I.waitForVisible(experimentalPostgresqlDashboardsPage.elements.barValue, 60);
    const values = await I.grabTextFromAll(experimentalPostgresqlDashboardsPage.elements.barValue);

    values.forEach((value) => {
      const valueInt = parseInt(value.replace('%', ''), 10);

      I.assertAbove(valueInt, 0, 'The value for Postgres vacuum is zero, it supposed to be > 0');
    });

    const output = await I.verifyCommand('sudo docker exec pgsql_vacuum_db psql -U postgres -d dvdrental -c \'SELECT tablename FROM pg_catalog.pg_tables;\'');
    const allTables = output.split(/\r?\n/);

    await experimentalPostgresqlDashboardsPage.vacuumAnalyzeTables(allTables);
    await experimentalPostgresqlDashboardsPage.waitForLastVacuumValues(600);
    await experimentalPostgresqlDashboardsPage.waitForLastAnalyzeValues(600);
  },
);
