const { adminPage } = inject();

Feature('Test PMM server with external PostgreSQL').retry(1);

const pathToPMMFramework = adminPage.pathToPMMTests;
const DOCKER_IMAGE = process.env.DOCKER_VERSION || 'perconalab/pmm-server:dev-latest';

const runPMMWithExternalPGWithSSL = `docker run -d -p 8082:80 -p 447:443 \ 
    --name PMM-T1678 \
    --network external-pg \
    -v ${pathToPMMFramework}tls-ssl-setup/postgres/14:/certs \
    -e PERCONA_TEST_POSTGRES_SSL_CA_PATH=/certs/ca.crt \
    -e PERCONA_TEST_POSTGRES_SSL_KEY_PATH=/certs/client.pem \
    -e PERCONA_TEST_POSTGRES_SSL_CERT_PATH=/certs/client.crt \
    -e PERCONA_TEST_POSTGRES_SSL_MODE=verify-ca \
    -e PERCONA_TEST_POSTGRES_DBNAME=postgres \
    -e PERCONA_TEST_POSTGRES_ADDR=pgsql_14:5432 \
    -e PERCONA_TEST_POSTGRES_USERNAME=pmm \
    -e PERCONA_TEST_POSTGRES_DBPASSWORD=pmm \
    ${DOCKER_IMAGE}`;

const data = new DataTable(['containerName', 'postgresqlAddress', 'serverPort']);

data.add(['pmm-server-external-postgres', 'external-postgres:5432', '8081']);
// data.add(['PMM-T1681', 'pgsql_14:5432', '8082']);

BeforeSuite(async ({ I }) => {
  // await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=14 --setup-postgres-ssl --pmm2`);
  // await I.verifyCommand('docker network create external-pg || true');
  // await I.verifyCommand('docker network connect external-pg pgsql_14 || true');

  // Start PMM with latest released version
  await I.verifyCommand('PMM_SERVER_IMAGE=percona/pmm-server:latest docker-compose -f docker-compose-external-pg.yml up -d');
  // await I.verifyCommand(runPMMWithExternalPGWithSSL);
  await I.wait(30);
});

Before(async ({ I }) => {
  await I.Authorize('admin', 'admin');
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-external-pg.yml down -v');
  // await I.verifyCommand('docker stop pgsql_14 || docker rm pgsql_14');
});

Data(data).Scenario(
  '@PMM-T1678 Verify PMM with external PostgreSQL @docker-configuration',
  async ({
    I, dashboardPage, qanPage, qanOverview, pmmInventoryPage, current,
  }) => {
    const basePmmUrl = `http://127.0.0.1:${current.serverPort}/`;
    const serviceName = 'pmm-server-postgresql';
    const { postgresqlAddress } = current;

    const postgresDataSourceLocator = locate('div').withChild(locate('h2 > a').withText('PostgreSQL'));

    // Verify the env variable works on released version
    I.amOnPage(`${basePmmUrl}graph/datasources`);
    I.waitForVisible(postgresDataSourceLocator, 30);

    // Docker way upgrade
    await I.verifyCommand(`PMM_SERVER_IMAGE=${DOCKER_IMAGE} docker-compose -f docker-compose-external-pg.yml up -d pmm-server-external-postgres`);
    await I.wait(120);

    I.amOnPage(`${basePmmUrl}graph/datasources`);
    I.waitForVisible(postgresDataSourceLocator, 30);
    I.seeTextEquals(`${'PostgreSQL\n'
      + '|\n'}${
      postgresqlAddress}`, locate(postgresDataSourceLocator).find('//div[2]'));

    I.amOnPage(`${basePmmUrl}${pmmInventoryPage.url}`);
    await I.waitForVisible(pmmInventoryPage.fields.serviceRow(serviceName), 30);
    I.assertEqual(await pmmInventoryPage.servicesTab.getServiceMonitoringStatus(serviceName), 'OK',
      `'${serviceName}' is expected to have 'OK' monitoring status`);

    I.amOnPage(I.buildUrlWithParams(`${basePmmUrl}${dashboardPage.postgresqlInstanceSummaryDashboard.cleanUrl}`, { service_name: serviceName, node_name: 'pmm-server-db' }));
    dashboardPage.waitForDashboardOpened();
    I.waitForText('YES', 20, locate('[aria-label="Connected panel"]'));

    I.wait(30);
    I.amOnPage(I.buildUrlWithParams(`${basePmmUrl}${qanPage.clearUrl}`, { service_name: serviceName, node_name: 'pmm-server-db' }));
    qanOverview.waitForOverviewLoaded();
  },
);
