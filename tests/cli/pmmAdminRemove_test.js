Feature('pmm-admin remove tests');

const pmmServerPort = '8787';
const basePmmUrl = `http://127.0.0.1:${pmmServerPort}/`;
const clientPassword = 'gfaks4d8OH';
const services = ['mysql', 'mongodb', 'postgresql', 'proxysql', 'external', 'haproxy']

BeforeSuite(async ({ I }) => {
  await I.verifyCommand(`PMM_SERVER_IMAGE=${process.env.DOCKER_VERSION} docker-compose -f docker-compose-pmm-admin-remove.yml up -d pmm-server-remove`);
  await I.verifyCommand('docker-compose -f docker-compose-pmm-admin-remove.yml up -d pmm-client-remove');
  await I.verifyCommand('docker-compose -f docker-compose-pmm-admin-remove.yml up -d mysql5.7');
  await I.verifyCommand('docker-compose -f docker-compose-pmm-admin-remove.yml up -d mongo4.2');
  await I.verifyCommand('docker-compose -f docker-compose-pmm-admin-remove.yml up -d postgres11');
  await I.wait(30);

  // adding services - 2 for each database type
  for (let i = 0; i < 2; i++) {
    await I.verifyCommand(`docker exec pmm-client-remove pmm-admin add mysql --username=root --password=${clientPassword} mysql5.7 --service-name=mysql${i} mysql5.7:3306`);
    await I.verifyCommand(`docker exec pmm-client-remove pmm-admin add mongodb --username=root --password=${clientPassword} mongo4.2 --service-name=mongodb${i} mongo4.2:27017`);
    await I.verifyCommand(`docker exec pmm-client-remove pmm-admin add postgresql --username=postgres --password=${clientPassword} postgres11 --service-name=postgresql${i} postgres11:5432`);
    await I.verifyCommand(`docker exec pmm-client-remove pmm-admin add proxysql --skip-connection-check --service-name=proxysql${i}`);
    await I.verifyCommand(`docker exec pmm-client-remove pmm-admin add external --listen-port=1 --skip-connection-check --service-name=external${i}`);
    await I.verifyCommand(`docker exec pmm-client-remove pmm-admin add haproxy --listen-port=1 --skip-connection-check haproxy${i}`);
  }
  await I.wait(10);
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-pmm-admin-remove.yml down -v');
});

Scenario(
  'PMM-T1286, PMM-T1287, PMM-T1288, PMM-T1308 - Verify service removal without specifying service name/service id @cli',
  async ({ I }) => {
    for (let i = 0; i < services.length; i++) {
      I.verifyCommand(
        `docker exec pmm-client-remove pmm-admin remove ${services[i]}`,
        'We could not find a service associated with the local node. Please provide "Service ID" or "Service name"',
        'fail',
      );
    }

    // remove services - only one per each database type left
    for (let i = 0; i < services.length; i++) {
      I.verifyCommand(
        `docker exec pmm-client-remove pmm-admin remove ${services[i]} ${services[i]}0`,
        'Service removed.',
      );
    }

    // remove services with db type only
    services.forEach((service) => {
      I.verifyCommand(
        `docker exec pmm-client-remove pmm-admin remove ${service}`,
        'Service removed.',
      );
    })
  }
);
