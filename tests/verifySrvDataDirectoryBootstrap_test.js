const assert = require('assert');
const moment = require('moment');

Feature('Test PMM server with srv local folder');

const basePmmUrl = 'http://127.0.0.1:8080/';

BeforeSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-srv.yml up -d');
  await I.wait(90);
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-srv.yml down -v');
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

    await I.verifyCommand('docker-compose -f docker-compose-srv.yml down');
    await I.verifyCommand('docker-compose -f docker-compose-srv.yml up -d');
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
  },
);
