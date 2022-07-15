const assert = require('assert');
const moment = require('moment');

Feature('Test PMM server with srv local folder');

const basePmmUrl = 'http://127.0.0.1:8080/';

const runContainer = async (I) => {
  await I.verifyCommand('docker run -v $HOME/srv:/srv -d --restart always --publish 8080:80 --publish 8443:443 --name pmm-server-srv perconalab/pmm-server:2.29.0-rc');
};

const stopAndRemoveContainer = async (I) => {
  await I.verifyCommand('docker stop pmm-server-srv');
  await I.verifyCommand('docker rm pmm-server-srv');
};

BeforeSuite(async ({ I }) => {
  await runContainer(I);
  await I.wait(90);
});

AfterSuite(async ({ I }) => {
  await stopAndRemoveContainer(I);
});

Before(async ({ I }) => {
  await I.Authorize('admin', 'new-flag-password');
});

Scenario(
  'PMM-T1243 Verify PMM Server without data container @srv',
  async ({
    I, adminPage, qanPage, dashboardPage,
  }) => {
    await I.amOnPage(basePmmUrl + qanPage.url);
    I.dontSeeElement(qanPage.elements.noQueryAvailable);
    await I.waitForVisible(qanPage.elements.qanRow);
    const qanRows = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(qanRows > 0, 'Query Analytics are empty');

    await I.amOnPage(basePmmUrl + dashboardPage.nodeSummaryDashboard.url);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();

    await stopAndRemoveContainer(I);
    await runContainer(I);
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
