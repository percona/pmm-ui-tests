Feature('Test Dashboards');
const { dashboardPage } = inject();

const dashboard = new DataTable(['page', 'content']);
const mySQLContent = dashboardPage.fields.mySQLServiceSummaryContent;
const postgresContent = dashboardPage.fields.postgreSQLServiceSummaryContent;
const mongoContent = dashboardPage.fields.mongoDBServiceSummaryContent;

dashboard.add([dashboardPage.mysqlInstanceSummaryDashboard.url, mySQLContent]);
dashboard.add([dashboardPage.postgresqlInstanceSummaryDashboard.url, postgresContent]);
dashboard.add([dashboardPage.mongoDbInstanceSummaryDashboard.url, mongoContent]);

Before(async ({ I }) => {
  await I.Authorize();
});

Data(dashboard).Scenario(
  'PMM-T671, PMM-T666, PMM-T672 - Verify summary is displayed on Instance Summary dashboard @nightly',
  async ({ I, dashboardPage, current }) => {
    I.amOnPage(current.page);
    dashboardPage.waitForDashboardOpened();
    I.waitForVisible(dashboardPage.fields.serviceSummary, 30);
    I.click(dashboardPage.fields.serviceSummary);
    I.waitForVisible(current.content, 150);
  },
);
