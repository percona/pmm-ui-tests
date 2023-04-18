Feature('pmm-admin remove tests');

const pmmServerPort = '8787';
const basePmmUrl = `http://127.0.0.1:${pmmServerPort}/`;
const clientPassword = 'gfaks4d8OH';
const services = ['mysql', 'mongodb', 'postgresql', 'proxysql', 'external', 'haproxy']

BeforeSuite(async ({ I }) => {
  // await I.verifyCommand(`PMM_SERVER_IMAGE=${process.env.DOCKER_VERSION} docker-compose -f docker-compose-pmm-admin-remove.yml up -d`); //todo
  await I.verifyCommand(`docker compose -f docker-compose-pmm-admin-remove.yml up -d pmm-server-remove`);
  // await I.verifyCommand(`timeout 100 bash -c 'while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' 127.0.0.1:${pmmServerPort}/ping)" != "200" ]]; do sleep 5; done' || false`);
  await I.verifyCommand('docker compose -f docker-compose-pmm-admin-remove.yml up -d pmm-client-remove');
  await I.verifyCommand('docker compose -f docker-compose-pmm-admin-remove.yml up -d mysql5.7');
  await I.verifyCommand('docker compose -f docker-compose-pmm-admin-remove.yml up -d mongo4.2');
  await I.verifyCommand('docker compose -f docker-compose-pmm-admin-remove.yml up -d postgres11');
  await I.wait(20);
  await I.verifyCommand(`docker exec pmm-client-remove pmm-admin add mysql --username=root --password=${clientPassword} --query-source=perfschema mysql5.7 mysql5.7:3306`);
  await I.verifyCommand(`docker exec pmm-client-remove pmm-admin add mongodb --username=root --password=${clientPassword} mongo4.2 mongo4.2:27017`);
  await I.verifyCommand(`docker exec pmm-client-remove pmm-admin add postgresql --username=postgres --password=${clientPassword} postgres11 postgres11:5432`);
  await I.verifyCommand(`docker exec pmm-client-remove pmm-admin add proxysql --skip-connection-check`);
  await I.verifyCommand(`docker exec pmm-client-remove pmm-admin add external --listen-port=1 --skip-connection-check`);
  await I.verifyCommand(`docker exec pmm-client-remove pmm-admin add haproxy --listen-port=1 --skip-connection-check`);
  await I.wait(20);
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker compose -f docker-compose-pmm-admin-remove.yml down -v');
});

Scenario('PMM-T1286 - Verify service removal without specifying service name/service id @cli', async ({ I }) => {
  services.forEach((service) => {
    I.verifyCommand(
      `docker exec pmm-client-remove pmm-admin remove ${service}`,
      'Service removed.',
    );
  })
});