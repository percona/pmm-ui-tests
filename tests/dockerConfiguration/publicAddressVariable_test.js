const assert = require('assert');

Feature('Tests for PMM_PUBLIC_ADDRESS environment variable');

const dockerVersion = process.env.DOCKER_VERSION || 'perconalab/pmm-server:dev-latest';
const serverIP = process.env.SERVER_IP || '127.0.0.1';
let portalUser;
let adminToken;
let freeOrg;
const publicIPs = new DataTable(['testCase', 'publicAddress']);

publicIPs.add(['PMM-T1173', serverIP]);
publicIPs.add(['PMM-T1173', `${serverIP}:8443`]);
publicIPs.add(['PMM-T1174', 'ec2-18-188-74-98.us-east-2.compute.amazonaws.com']);
publicIPs.add(['PMM-T1174', 'ec2-18-188-74-98.us-east-2.compute.amazonaws.com:8443']);

const runContainerWithPublicAddressVariable = async (I, publicAddress) => {
  await I.verifyCommand(`docker run -d --restart always -e PERCONA_TEST_PLATFORM_ADDRESS=https://check-dev.percona.com:443 -e PMM_PUBLIC_ADDRESS=${publicAddress} --publish 8085:80 --publish 8443:443 --name pmm-server ${dockerVersion}`);
  await I.wait(30);
};

const runContainerWithPublicAddressVariableUpgrade = async (I, publicAddress) => {
  await I.verifyCommand(`docker run -d --restart always -e PERCONA_TEST_PLATFORM_ADDRESS=https://check-dev.percona.com:443 -e PMM_PUBLIC_ADDRESS=${publicAddress} --publish 8085:80 --publish 8443:443 --name pmm-server percona/pmm-server:latest`);
  await I.verifyCommand('docker exec pmm-server yum update -y percona-release');
  await I.verifyCommand('docker exec pmm-server sed -i\'\' -e \'s^/release/^/experimental/^\' /etc/yum.repos.d/pmm2-server.repo');
  await I.verifyCommand('docker exec pmm-server percona-release enable percona experimental');
  await I.verifyCommand('docker exec pmm-server yum clean all');
  await I.verifyCommand('docker restart pmm-server');
  await I.wait(30);
};

Before(async ({ I, portalAPI }) => {
  portalUser = await portalAPI.getUser();
  await portalAPI.oktaCreateUser(portalUser);
  adminToken = await portalAPI.getUserAccessToken(portalUser.email, portalUser.password);
  freeOrg = await portalAPI.apiCreateOrg(adminToken);

  await I.Authorize();
});

After(async ({ I, portalAPI }) => {
  await portalAPI.apiDeleteOrg(freeOrg.id, adminToken);
  await portalAPI.oktaDeleteUserByEmail(portalUser.email);
  await I.verifyCommand('docker stop pmm-server');
  await I.verifyCommand('docker rm pmm-server');
});

Data(publicIPs).Scenario(
  'PMM-T1173 PMM-T1174 Verify PMM_PUBLIC_ADDRESS env variable with IP @docker-configuration',
  async ({
    I, pmmSettingsPage, current, portalAPI, perconaPlatformPage,
  }) => {
    const basePmmUrl = 'http://127.0.0.1:8085/';
    const { testCase, publicAddress } = current;

    I.say(testCase);
    await runContainerWithPublicAddressVariable(I, publicAddress);
    await I.amOnPage(basePmmUrl + pmmSettingsPage.advancedSettingsUrl);
    await I.waitForVisible(pmmSettingsPage.fields.publicAddressInput, 30);
    const setPublicAddress = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

    assert.ok(setPublicAddress === publicAddress, 'Set public address does not equal to one specified in public address environment variable');

    await I.amOnPage(basePmmUrl + perconaPlatformPage.url);
    I.waitForVisible(perconaPlatformPage.elements.settingsContent, 30);
    await perconaPlatformPage.connectToPortal(adminToken);
  },
);

Scenario(
  'PMM-T1176 Verify PMM_PUBLIC_ADDRESS env variable after upgrade @docker-configuration',
  async ({
    I, pmmSettingsPage, homePage,
  }) => {
    const basePmmUrl = 'http://127.0.0.1:8085/';

    await runContainerWithPublicAddressVariableUpgrade(I, '127.0.0.1');
    await I.amOnPage(basePmmUrl + homePage.url);
    await I.waitForElement(homePage.fields.dashboardHeaderLocator, 60);
    const { versionMinor } = await homePage.getVersions();

    await homePage.upgradePMM(versionMinor);

    await I.amOnPage(basePmmUrl + pmmSettingsPage.advancedSettingsUrl);
    await I.waitForVisible(pmmSettingsPage.fields.publicAddressInput, 30);
    const setPublicAddress = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

    assert.ok(setPublicAddress === '127.0.0.1', 'Set public address does not equal to one specified in public address environment variable');
  },
);

Scenario(
  'PMM-T117 Verify PMM_PUBLIC_ADDRESS env variable can be updated @docker-configuration2',
  async ({
    I, pmmSettingsPage, perconaPlatformPage,
  }) => {
    const basePmmUrl = 'http://127.0.0.1:8085/';

    await runContainerWithPublicAddressVariable(I, '127.0.0.5');
    await I.amOnPage(basePmmUrl + pmmSettingsPage.advancedSettingsUrl);
    await I.waitForVisible(pmmSettingsPage.fields.publicAddressInput, 30);
    await pmmSettingsPage.clearPublicAddress();
    await pmmSettingsPage.addPublicAddress('127.0.0.1');
    const setPublicAddress = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

    assert.ok(setPublicAddress === '127.0.0.1', 'Set public address does not equal to one specified in public address environment variable');
    await I.amOnPage(basePmmUrl + perconaPlatformPage.url);
    I.waitForVisible(perconaPlatformPage.elements.settingsContent, 30);
    await perconaPlatformPage.connectToPortal(adminToken);
  },
);
