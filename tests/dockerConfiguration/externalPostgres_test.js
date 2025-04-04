const { adminPage } = inject();

Feature('Test PMM server with external PostgreSQL').retry(1);

const DOCKER_IMAGE = process.env.DOCKER_VERSION || 'perconalab/pmm-server:3-dev-latest';
const data = new DataTable(['composeName', 'containerName', 'postgresqlAddress', 'serverPort']);

// data.add(['docker-compose-external-pg', 'pmm-server-external-postgres', 'external-postgres:5432', '8081']);
data.add(['docker-compose-external-pg-ssl', 'pmm-server-external-postgres-ssl', 'external-postgres-ssl:5432', '8082']);

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker compose -f docker-compose-external-pg.yml down -v || true');
  await I.verifyCommand('docker compose -f docker-compose-external-pg-ssl.yml down -v || true');
});

Data(data).Scenario(
  'PMM-T1678 - Verify PMM with external PostgreSQL including upgrade @docker-configuration',
  async ({
    I, dashboardPage, pmmInventoryPage, current, queryAnalyticsPage,
  }) => {
    const { postgresqlAddress, composeName, containerName } = current;
    const basePmmUrl = `http://127.0.0.1:${current.serverPort}/`;
    const serviceName = 'pmm-server-postgresql';
    const postgresDataSourceLocator = locate('div').withChild(locate('h2 > a').withText('PostgreSQL'));

    await I.verifyCommand(`PMM_SERVER_IMAGE=${DOCKER_IMAGE} docker compose -f ${composeName}.yml up -d`);
    await I.verifyCommand('docker exec external-postgres psql "postgresql://postgres:pmm_password@localhost/grafana" -c \'CREATE EXTENSION IF NOT EXISTS pg_stat_statements;\'');
    await I.verifyCommand(`docker container restart ${containerName}`);
    await I.wait(30);

    await I.Authorize('admin', 'admin', basePmmUrl);
    I.amOnPage(`${basePmmUrl}graph/datasources`);
    I.waitForVisible(postgresDataSourceLocator, 30);
    I.seeTextEquals(`${'PostgreSQL\n'
      + '|\n'}${
      postgresqlAddress}`, locate(postgresDataSourceLocator).find('//div[2]'));

    I.amOnPage(`${basePmmUrl}${pmmInventoryPage.url}`);
    await I.waitForVisible(pmmInventoryPage.fields.serviceRow(serviceName), 30);

    I.assertEqual(
      await pmmInventoryPage.servicesTab.getServiceMonitoringStatus(serviceName),
      'OK',
      `'${serviceName}' is expected to have 'OK' monitoring status`,
    );

    I.amOnPage(I.buildUrlWithParams(`${basePmmUrl}${dashboardPage.postgresqlInstanceSummaryDashboard.cleanUrl}`, { service_name: serviceName, node_name: 'pmm-server-db' }));
    dashboardPage.waitForDashboardOpened();
    I.waitForText('YES', 20, locate('//section[@data-testid="data-testid Panel header Connected"]//div[@data-testid="data-testid panel content"]//span'));

    I.amOnPage(I.buildUrlWithParams(`${basePmmUrl}${queryAnalyticsPage.url}`, { service_name: serviceName, node_name: 'pmm-server-db' }));
    queryAnalyticsPage.waitForLoaded();
    I.assertTrue((await queryAnalyticsPage.data.getRowCount()) > 0, 'QAN does not have data!');
  },
);
