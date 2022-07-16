const assert = require('assert');
const moment = require('moment');

Feature('Test PMM server with srv local folder');

const basePmmUrl = 'http://127.0.0.1:8080/';
const testCaseName = 'Initialized value';

const testCase = new DataTable(['number']);

testCase.add(['PMM-T1243']);
testCase.add(['PMM-T1244']);

After(async ({ I, current }) => {
  I.say(testCaseName);
  if (testCaseName === 'PMM-T1244') {
    I.say(testCaseName);
    await stopAndRemoveContainerWithDataContainer(I);
  } else if (testCaseName === 'PMM-T1243') {
    I.say(testCaseName);
    await stopAndRemoveContainerWithoutDataContainer(I);
  }
});

const runContainerWithoutDataContainer = async (I) => {
  await I.verifyCommand('docker run -v $HOME/srv:/srv -d --restart always --publish 8080:80 --publish 8443:443 --name pmm-server-srv perconalab/pmm-server:2.29.0-rc');
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

Data(testCase).Scenario(
  'PMM-T1243 Verify PMM Server without data container @srv3',
  async ({
    I, adminPage, qanPage, dashboardPage, current,
  }) => {
    const { number } = current;
    const testCaseName = number;

    await runContainerWithoutDataContainer(I);
    await I.wait(90);
    await I.Authorize('admin', 'new-flag-password');
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
    await stopAndRemoveContainerWithoutDataContainer(I);
  },
);

Scenario(
  'PMM-T1243 Verify PMM Server without data container @srv2',
  async ({
    I, adminPage, qanPage, dashboardPage,
  }) => {
    await runContainerWithDataContainer(I);
    await I.wait(90);
    await I.Authorize('admin', 'new-flag-password');
    await I.amOnPage(basePmmUrl + qanPage.url);
    /*
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

    */
  },
);
