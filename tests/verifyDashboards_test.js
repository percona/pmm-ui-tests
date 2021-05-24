Feature('Test Dashboards');
const { dashboardPage } = inject();

const dashboard = new DataTable(['page', 'content']);

dashboard.add([dashboardPage.mysqlInstanceSummaryDashboard.url, dashboardPage.fields.mySQLServiceSummaryContent]);
// dashboard.add([dashboardPage.postgresqlInstanceSummaryDashboard.url, dashboardPage.fields.postgreSQLServiceSummaryContent]);
dashboard.add([dashboardPage.mongoDbInstanceSummaryDashboard.url, dashboardPage.fields.mongoDBServiceSummaryContent]);

Before(async ({ I }) => {
  await I.Authorize();
});

Data(dashboard).Scenario(
  'PMM-T671 - Verify MySQL summary is displayed on MySQL Instance Summary dashboard @nightly',
  async ({ I, dashboardPage, current }) => {
    I.amOnPage(current.page);
    dashboardPage.waitForDashboardOpened();
    I.waitForVisible(dashboardPage.fields.serviceSummary, 30);
    I.click(dashboardPage.fields.serviceSummary);
    I.waitForVisible(current.content, 150);
  },
);
