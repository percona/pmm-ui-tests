const assert = require('assert');
const moment = require('moment');

Feature('Test PMM server with srv local folder');

const basePmmUrl = 'http://127.0.0.1:8080/';
let testCaseName = '';

const runContainerWithoutDataContainer = async (I) => {
  await I.verifyCommand('docker run -v $HOME/srv:/srv -d --restart always --publish 8080:80 --publish 8443:443 --name pmm-server-srv perconalab/pmm-server:2.29.0-rc');
};

const runContainerWithPasswordVariable = async (I) => {
  await I.verifyCommand('docker run -v $HOME/srv:/srv -d -e GF_SECURITY_ADMIN_PASSWORD=newpass --restart always --publish 8080:80 --publish 8443:443 --name pmm-server-password perconalab/pmm-server:2.29.0-rc');
};

const runContainerWithDataContainer = async (I) => {
  await I.verifyCommand('docker create -v /srv --name pmm-server-test busybox');
  await I.verifyCommand('docker run --detach --restart always --publish 8080:80 --publish 8443:443 --volumes-from pmm-server-test --name pmm-server-srv perconalab/pmm-server:2.29.0-rc');
};

const stopAndRemoveContainerWithoutDataContainer = async (I) => {
  await I.verifyCommand('docker stop pmm-server-srv');
  await I.verifyCommand('docker rm pmm-server-srv');
};

const stopAndRemoveContainerWithDataContainer = async (I) => {
  await I.verifyCommand('docker stop pmm-server-srv');
  await I.verifyCommand('docker rm pmm-server-srv');
  await I.verifyCommand('docker stop pmm-server-test');
  await I.verifyCommand('docker rm pmm-server-test');
};

After(async ({ I }) => {
  if (testCaseName === 'PMM-T1243') {
    await stopAndRemoveContainerWithoutDataContainer(I);
  } else if (testCaseName === 'PMM-T1244') {
    await stopAndRemoveContainerWithDataContainer(I);
  }
});

Scenario(
  'PMM-T1243 Verify PMM Server without data container @srv',
  async ({
    I, adminPage, qanPage, dashboardPage,
  }) => {
    await runContainerWithoutDataContainer(I);
    await I.Authorize('admin', 'admin');
    await I.wait(90);
    testCaseName = 'PMM-T1243';
    await I.amOnPage(basePmmUrl + qanPage.url);
    I.dontSeeElement(qanPage.elements.noQueryAvailable);
    await I.waitForVisible(qanPage.elements.qanRow);
    const qanRows = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(qanRows > 0, 'Query Analytics are empty');

    await I.amOnPage(basePmmUrl + dashboardPage.nodeSummaryDashboard.url);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();

    await stopAndRemoveContainerWithoutDataContainer(I);
    await runContainerWithoutDataContainer(I);
    await I.wait(60);
    await I.amOnPage(basePmmUrl + qanPage.url);
    adminPage.setAbsoluteTimeRange(moment().subtract({ hours: 12 }).format('YYYY-MM-DD HH:mm:00'), moment().subtract({ minutes: 2 }).format('YYYY-MM-DD HH:mm:00'));

    I.dontSeeElement(qanPage.elements.noQueryAvailable);
    await I.waitForVisible(qanPage.elements.qanRow);
    const qanRowsAfterRestart = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(qanRowsAfterRestart > 0, 'Query Analytics are empty after restart of docker container');

    await I.amOnPage(basePmmUrl + dashboardPage.nodeSummaryDashboard.url);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
    I.say(await I.verifyCommand('docker logs pmm-server-srv'));
  },
);

Scenario(
  'PMM-T1244 Verify PMM Server with empty data container @srv',
  async ({
    I, adminPage, qanPage, dashboardPage,
  }) => {
    await runContainerWithDataContainer(I);
    await I.Authorize('admin', 'admin');
    await I.wait(90);
    testCaseName = 'PMM-T1244';
    await I.amOnPage(basePmmUrl + qanPage.url);
    I.dontSeeElement(qanPage.elements.noQueryAvailable);
    await I.waitForVisible(qanPage.elements.qanRow);
    const qanRows = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(qanRows > 0, 'Query Analytics are empty');
    await I.amOnPage(basePmmUrl + dashboardPage.nodeSummaryDashboard.url);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();

    await stopAndRemoveContainerWithDataContainer(I);
    await runContainerWithDataContainer(I);
    await I.wait(60);
    await I.amOnPage(basePmmUrl + qanPage.url);
    adminPage.setAbsoluteTimeRange(moment().subtract({ hours: 12 }).format('YYYY-MM-DD HH:mm:00'), moment().subtract({ minutes: 2 }).format('YYYY-MM-DD HH:mm:00'));

    I.dontSeeElement(qanPage.elements.noQueryAvailable);
    await I.waitForVisible(qanPage.elements.qanRow);
    const qanRowsAfterRestart = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(qanRowsAfterRestart > 0, 'Query Analytics are empty after restart of docker container');

    await I.amOnPage(basePmmUrl + dashboardPage.nodeSummaryDashboard.url);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
    I.say(await I.verifyCommand('docker logs pmm-server-srv'));
  },
);
/*
Scenario(
  'PMM-T1244 Verify PMM Server with empty data container @srv33',
  async ({
    I, adminPage, qanPage, dashboardPage, homePage,
  }) => {
    // await runContainerWithPasswordVariable(I);
    // await I.wait(90);
    // I.say(await I.verifyCommand('docker logs pmm-server-password'));

    await I.Authorize();
    await I.amOnPage(basePmmUrl + homePage.url);
    await I.waitForVisible('//*[contains(text(), "invalid username or password")]');
    await I.unAuthorize();
    await I.wait(3);
    await I.Authorize('admin', 'newpass');
    await I.wait(3);
    await I.refreshPage();
    await I.waitForElement(homePage.fields.dashboardHeaderLocator, 60);
    await I.wait(160);
  },
);
*/
