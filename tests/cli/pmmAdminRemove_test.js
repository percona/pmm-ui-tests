Feature('pmm-admin remove tests');

const pmmServerPort = '8787';
const basePmmUrl = `http://127.0.0.1:${pmmServerPort}/`;
const clientPassword = 'gfaks4d8OH';

BeforeSuite(async ({ I }) => {
  // await I.verifyCommand(`PMM_SERVER_IMAGE=${process.env.DOCKER_VERSION} docker-compose -f docker-compose-pmm-admin-remove.yml up -d`); //todo
  await I.verifyCommand(`docker compose -f docker-compose-pmm-admin-remove.yml up -d pmm-server-remove`);
  // await I.verifyCommand(`timeout 100 bash -c 'while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' 127.0.0.1:${pmmServerPort}/ping)" != "200" ]]; do sleep 5; done' || false`);
  await I.verifyCommand('docker compose -f docker-compose-pmm-admin-remove.yml up -d pmm-client');
  await I.verifyCommand('docker compose -f docker-compose-pmm-admin-remove.yml up -d mysql5.7');
  await I.wait(30);
  await I.verifyCommand(`docker exec pmm-client-remove pmm-admin add mysql --username=root --password=${clientPassword} --query-source=perfschema mysql5.7 mysql5.7:3306`);
  await I.wait(60);
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker compose -f docker-compose-pmm-admin-remove.yml down -v');
});

Scenario('PMM-T1286 - Verify service removal without specifying service name/service id @cli', async ({ I }) => {
  await I.verifyCommand(
    'docker exec pmm-client-remove pmm-admin remove mysql',
    'Service removed.',
  );
});
