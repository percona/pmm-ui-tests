Feature('PT Summary');
const { dashboardPage } = inject();

const dashboard = new DataTable(['page', 'content', 'service_name']);

dashboard.add([dashboardPage.mysqlInstanceSummaryDashboard.url,
  dashboardPage.fields.mySQLServiceSummaryContent, 'ps_']);
dashboard.add([dashboardPage.postgresqlInstanceSummaryDashboard.url,
  dashboardPage.fields.postgreSQLServiceSummaryContent, 'PGSQL_']);
dashboard.add([dashboardPage.mongoDbInstanceSummaryDashboard.url,
  dashboardPage.fields.mongoDBServiceSummaryContent, 'mongodb_']);

Before(async ({ I }) => {
  await I.Authorize();
});

Data(dashboard).Scenario(
  'PMM-T671, PMM-T666, PMM-T672 - Verify summary is displayed on Instance Summary dashboard @dashboards @nightly',
  async ({
    I, dashboardPage, adminPage, current,
  }) => {
    I.amOnPage(current.page);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Service Name', current.service_name);
    I.click(adminPage.fields.metricTitle);
    I.waitForVisible(dashboardPage.fields.serviceSummary, 30);
    I.click(dashboardPage.fields.serviceSummary);
    I.waitForVisible(current.content, 150);
  },
).retry(1);
