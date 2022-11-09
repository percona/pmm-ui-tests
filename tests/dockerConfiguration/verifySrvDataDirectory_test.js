const assert = require('assert');
const moment = require('moment');

Feature('Test PMM server with srv volume and password enw variable');

let testCaseName = '';
const dockerVersion = process.env.DOCKER_VERSION || 'perconalab/pmm-server:dev-latest';

const runContainerWithoutDataContainer = async (I) => {
  await I.verifyCommand(`docker run -v $HOME/srvNoData:/srv -d --restart always --publish 8081:80 --name pmm-server-srv ${dockerVersion}`);
};

const runContainerWithPasswordVariable = async (I) => {
  await I.verifyCommand(`docker run -v $HOME/srvPassword:/srv -d -e GF_SECURITY_ADMIN_PASSWORD=newpass --restart always --publish 8082:80 --name pmm-server-password ${dockerVersion}`);
};

const runContainerWithPasswordVariableUpgrade = async (I) => {
  await I.verifyCommand('docker run -v $HOME/srvPasswordUpgrade:/srv -d -e GF_SECURITY_ADMIN_PASSWORD=newpass --restart always --publish 8084:80 --name pmm-server-password-upgrade percona/pmm-server:latest');
  await I.verifyCommand('docker exec pmm-server-password-upgrade yum update -y percona-release');
  await I.verifyCommand('docker exec pmm-server-password-upgrade sed -i\'\' -e \'s^/release/^/experimental/^\' /etc/yum.repos.d/pmm2-server.repo');
  await I.verifyCommand('docker exec pmm-server-password-upgrade percona-release enable percona experimental');
  await I.verifyCommand('docker exec pmm-server-password-upgrade yum clean all');
  await I.verifyCommand('docker restart pmm-server-password-upgrade');
};

const runContainerWithDataContainer = async (I) => {
  await I.verifyCommand(`docker run -v srvFolder:/srv -d --restart always --publish 8083:80 --name pmm-server-srv ${dockerVersion}`);
};

const stopAndRemoveContainerWithoutDataContainer = async (I) => {
  await I.verifyCommand('docker stop pmm-server-srv');
  await I.verifyCommand('docker rm pmm-server-srv');
};

const stopAndRemoveContainerWithPasswordVariable = async (I) => {
  await I.verifyCommand('docker stop pmm-server-password');
  await I.verifyCommand('docker rm pmm-server-password');
};

const stopAndRemoveContainerWithDataContainer = async (I) => {
  await I.verifyCommand('docker stop pmm-server-srv');
  await I.verifyCommand('docker rm pmm-server-srv');
};

After(async ({ I }) => {
  if (testCaseName === 'PMM-T1243') {
    await stopAndRemoveContainerWithoutDataContainer(I);
  } else if (testCaseName === 'PMM-T1244') {
    await stopAndRemoveContainerWithDataContainer(I);
    await I.verifyCommand('docker volume rm srvFolder');
  } else if (testCaseName === 'PMM-T1255') {
    await stopAndRemoveContainerWithPasswordVariable(I);
  }
});

Scenario(
  'PMM-T1243 Verify PMM Server without data container @docker-configuration',
  async ({
    I, adminPage, qanPage, dashboardPage,
  }) => {
    const basePmmUrl = 'http://127.0.0.1:8081/';

    await runContainerWithoutDataContainer(I);
    await I.Authorize('admin', 'admin');
    await I.wait(120);
    testCaseName = 'PMM-T1243';
    await I.amOnPage(basePmmUrl + qanPage.url);
    await I.waitForInvisible(qanPage.elements.noQueryAvailable, 180);
    await I.waitForVisible(qanPage.elements.qanRow);
    const qanRows = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(qanRows > 0, 'Query Analytics are empty');
    await I.amOnPage(`${basePmmUrl + dashboardPage.nodeSummaryDashboard.url}?orgId=1&refresh=5s`);
    await dashboardPage.waitForAllGraphsToHaveData(300);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();

    await stopAndRemoveContainerWithoutDataContainer(I);
    await runContainerWithoutDataContainer(I);
    await I.wait(60);
    const logs = await I.verifyCommand('docker logs pmm-server-srv');

    assert.ok(!logs.includes('Error: The directory named as part of the path /srv/logs/supervisord.log does not exist'));
    await I.amOnPage(basePmmUrl + qanPage.url);
    adminPage.setAbsoluteTimeRange(moment().subtract({ hours: 12 }).format('YYYY-MM-DD HH:mm:00'), moment().subtract({ minutes: 1 }).format('YYYY-MM-DD HH:mm:00'));

    await I.waitForInvisible(qanPage.elements.noQueryAvailable, 180);
    await I.waitForVisible(qanPage.elements.qanRow);
    const qanRowsAfterRestart = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(qanRowsAfterRestart > 0, 'Query Analytics are empty after restart of docker container');

    await I.amOnPage(`${basePmmUrl + dashboardPage.nodeSummaryDashboard.url}?orgId=1&refresh=5s`);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
  },
);

Scenario(
  'PMM-T1244 Verify PMM Server with empty data container @docker-configuration',
  async ({
    I, adminPage, qanPage, dashboardPage,
  }) => {
    const basePmmUrl = 'http://127.0.0.1:8083/';

    await I.verifyCommand('docker volume create srvFolder');
    await runContainerWithDataContainer(I);
    await I.Authorize('admin', 'admin');
    await I.wait(60);
    testCaseName = 'PMM-T1244';
    await I.amOnPage(basePmmUrl + qanPage.url);
    I.dontSeeElement(qanPage.elements.noQueryAvailable);
    await I.waitForVisible(qanPage.elements.qanRow);
    const qanRows = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(qanRows > 0, 'Query Analytics are empty');
    await I.amOnPage(`${basePmmUrl + dashboardPage.nodeSummaryDashboard.url}?orgId=1&refresh=5s`);
    await dashboardPage.waitForAllGraphsToHaveData(300);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();

    await stopAndRemoveContainerWithDataContainer(I);
    await runContainerWithDataContainer(I);
    await I.wait(30);
    const logs = await I.verifyCommand('docker logs pmm-server-srv');

    assert.ok(!logs.includes('Error: The directory named as part of the path /srv/logs/supervisord.log does not exist'));
    await I.amOnPage(basePmmUrl + qanPage.url);
    adminPage.setAbsoluteTimeRange(moment().subtract({ hours: 12 }).format('YYYY-MM-DD HH:mm:00'), moment().subtract({ minutes: 1, seconds: 30 }).format('YYYY-MM-DD HH:mm:00'));

    I.dontSeeElement(qanPage.elements.noQueryAvailable);
    await I.waitForVisible(qanPage.elements.qanRow);
    const qanRowsAfterRestart = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(qanRowsAfterRestart > 0, 'Query Analytics are empty after restart of docker container');

    await I.amOnPage(`${basePmmUrl + dashboardPage.nodeSummaryDashboard.url}?orgId=1&refresh=5s`);
    await dashboardPage.waitForAllGraphsToHaveData(180);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
    I.say(await I.verifyCommand('docker logs pmm-server-srv'));
  },
);
// Skipped due to bug: https://jira.percona.com/browse/PMM-10325
Scenario.skip(
  'PMM-T1255 Verify GF_SECURITY_ADMIN_PASSWORD environment variable @docker-configuration',
  async ({
    I, adminPage, qanPage, dashboardPage, homePage,
  }) => {
    I.say('Alo covers: PMM-T1279 Verify GF_SECURITY_ADMIN_PASSWORD environment variable with change-admin-password');
    const basePmmUrl = 'http://127.0.0.1:8082/';

    await runContainerWithPasswordVariable(I);
    await I.wait(30);
    testCaseName = 'PMM-T1255';
    const logs = await I.verifyCommand('docker logs pmm-server-password');

    assert.ok(!logs.includes('Configuration warning: unknown environment variable "GF_SECURITY_ADMIN_PASSWORD=newpass".'));

    await I.Authorize();
    await I.amOnPage(basePmmUrl + homePage.url);
    await I.waitForVisible('//*[contains(text(), "invalid username or password")]');
    await I.unAuthorize();
    await I.refreshPage();
    await I.waitInUrl(homePage.landingPage);
    await I.Authorize('admin', 'newpass');
    await I.wait(1);
    await I.refreshPage();
    await I.waitForElement(homePage.fields.dashboardHeaderLocator, 60);
    await I.verifyCommand('docker exec -t pmm-server-password change-admin-password anotherpass');
    await I.unAuthorize();
    await I.waitInUrl(homePage.landingPage);
    await I.Authorize('admin', 'anotherpass');
    await I.wait(5);
    await I.refreshPage();
    await I.waitForElement(homePage.fields.dashboardHeaderLocator, 60);
  },
);

Scenario(
  'PMM-T1256 Verify GF_SECURITY_ADMIN_PASSWORD environment variable after upgrade @docker-configuration',
  async ({
    I, adminPage, qanPage, dashboardPage, homePage,
  }) => {
    const basePmmUrl = 'http://127.0.0.1:8084/';

    await runContainerWithPasswordVariableUpgrade(I);
    await I.wait(30);
    testCaseName = 'PMM-T1256';
    await I.Authorize('admin', 'newpass');
    await I.amOnPage(basePmmUrl + homePage.url);
    await I.waitForElement(homePage.fields.dashboardHeaderLocator, 60);
    const { versionMinor } = await homePage.getVersions();

    await homePage.upgradePMM(versionMinor, 'pmm-server-password-upgrade');
    await I.unAuthorize();
    await I.wait(5);
    await I.Authorize('admin', 'newpass');
    await I.refreshPage();
    await I.waitForElement(homePage.fields.dashboardHeaderLocator, 60);
  },
);
