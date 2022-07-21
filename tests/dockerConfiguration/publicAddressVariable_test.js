const assert = require('assert');

Feature('Tests for PMM_PUBLIC_ADDRESS environment variable');

const dockerVersion = process.env.DOCKER_VERSION || 'perconalab/pmm-server:dev-latest';
const serverIP = process.env.SERVER_IP || '127.0.0.1';
let portalUser;

const publicIPs = new DataTable(['testCase', 'publicAddress']);

publicIPs.add(['PMM-T1173', serverIP]);
publicIPs.add(['PMM-T1173', `${serverIP}:8443`]);
publicIPs.add(['PMM-T1174', 'ec2-18-188-74-98.us-east-2.compute.amazonaws.com']);
publicIPs.add(['PMM-T1174', 'ec2-18-188-74-98.us-east-2.compute.amazonaws.com:8443']);

const runContainerWithPublicAddressVariable = async (I, publicAddress) => {
  await I.verifyCommand(`docker run --restart always -e PMM_PUBLIC_ADDRESS=${publicAddress} --publish 8081:80 --publish 8443:443 --name pmm-server   ${dockerVersion}`);
};

Before(async ({ homePage, portalAPI }) => {
  portalUser = portalAPI.getUser();
  await portalAPI.oktaCreateUser(portalUser);
});

After(async ({}) => {
  await I.verifyCommand('docker stop pmm-server');
  await I.verifyCommand('docker rm pmm-server');
});

Data(publicIPs).Scenario(
  'PMM-T1173 PMM-T1174 Verify PMM_PUBLIC_ADDRESS env variable with IP @docker-configuration',
  async ({
    I, pmmSettingsPage, current, portalAPI, perconaPlatformPage,
  }) => {
    const { testCase, publicAddress } = current;

    I.say(testCase);
    await runContainerWithPublicAddressVariable(I, publicAddress);

    await I.waitForVisible(pmmSettingsPage.fields.publicAddressInput);
    const setPublicAddress = await I.grabTextFrom(pmmSettingsPage.fields.publicAddressInput);

    assert.ok(setPublicAddress === publicAddress, 'Set public address does not equal to one specified in public address environment variable');
    const adminToken = await portalAPI.getUserAccessToken(portalUser.email, portalUser.password);

    await perconaPlatformPage.openPerconaPlatform();
    await perconaPlatformPage.connectToPortal(adminToken);
  },
);
