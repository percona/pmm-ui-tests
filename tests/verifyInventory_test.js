const assert = require('assert');
const faker = require('faker');

const { adminPage } = inject();
const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;
const pathToPMMFramework = adminPage.pathToPMMTests;

Feature('Monitoring SSL/TLS MongoDB instances');

const instances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric']);

// instances.add(['mongodb_4.4_ssl_service', '4.4', 'mongodb_4.4', 'mongodb_ssl', 'mongodb_connections']);
// instances.add(['mongodb_4.2_ssl_service', '4.2', 'mongodb_4.2', 'mongodb_ssl', 'mongodb_connections']);
instances.add(['mongodb_5.0_ssl_service', '5.0', 'mongodb_5.0', 'mongodb_ssl', 'mongodb_connections']);

BeforeSuite(async ({ I, codeceptjsConfig }) => {
  // await I.verifyCommand(`${pmmFrameworkLoader} --mo-version=4.2 --setup-mongodb-ssl --pmm2`);
  // await I.verifyCommand(`${pmmFrameworkLoader} --mo-version=4.4 --setup-mongodb-ssl --pmm2`);
  // await I.verifyCommand(`${pmmFrameworkLoader} --mo-version=5.0 --setup-mongodb-ssl --pmm2`);
});

AfterSuite(async ({ I }) => {
  // await I.verifyCommand('docker stop mongodb_4.4 || docker rm mongodb_4.4');
  // await I.verifyCommand('docker stop mongodb_4.2 || docker rm mongodb_4.2');
  // await I.verifyCommand('docker stop mongodb_5.0 || docker rm mongodb_5.0');
});

Before(async ({ I, settingsAPI }) => {
  await I.Authorize();
});

Data(instances).Scenario(
  'PMM-T888 PMM-T919 Verify Adding SSL services remotely @ssl @ssl-remote @not-ui-pipeline',
  async ({
           I, remoteInstancesPage, pmmInventoryPage, current, grafanaAPI, inventoryAPI,
         }) => {
  }
);