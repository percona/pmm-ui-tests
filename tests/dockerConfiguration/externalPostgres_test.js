const assert = require('assert');

const { adminPage } = inject();

Feature('Test PMM server with external PostgreSQL');

const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;
const pathToPMMFramework = adminPage.pathToPMMTests;
const tlsCAFile = `${pathToPMMFramework}tls-ssl-setup/postgres/14/ca.crt`;
const tlsKeyFile = `${pathToPMMFramework}tls-ssl-setup/postgres/14/client.pem`;
const tlsCertFile = `${pathToPMMFramework}tls-ssl-setup/postgres/14/client.crt`;
const DOCKER_IMAGE = process.env.DOCKER_VERSION || 'perconalab/pmm-server:dev-latest';

const runPMMWithExternalPGWithSSL = `docker run -d -p 8082:80 -p 447:443 \ 
    --name PMM-T1681 \
    --network external-pg \
    -e PERCONA_TEST_PMM_DISABLE_BUILTIN_POSTGRES=1 \
    -e PERCONA_TEST_POSTGRES_SSL_CA_PATH=${tlsCAFile} \
    -e PERCONA_TEST_POSTGRES_SSL_KEY_PATH=${tlsKeyFile} \
    -e PERCONA_TEST_POSTGRES_SSL_CERT_PATH=${tlsCertFile}} \
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
  // await I.verifyCommand('docker network create external-pg');
  // await I.verifyCommand('docker network connect external-pg pgsql_14');
  await I.verifyCommand('docker-compose -f docker-compose-external-pg.yml up -d');
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
  '@PMM-T1678 @PMM-T1678 Verify PMM with external PostgreSQL @docker-configuration1',
  async ({
    I, dashboardPage, qanPage, qanOverview, pmmInventoryPage, current,
  }) => {
    const basePmmUrl = `http://127.0.0.1:${current.serverPort}/`;
    const serviceName = 'pmm-server-postgresql';
    const { postgresqlAddress } = current;
    const output = await I.verifyCommand(`docker-compose exec ${current.containerName} supervisorctl status`);

    assert.ok(!output.includes('postgres'));

    const postgresDataSourceLocator = locate('div').withChild(locate('h2 > a').withText('PostgreSQL'));

    await I.amOnPage(`${basePmmUrl}graph/datasources`);
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