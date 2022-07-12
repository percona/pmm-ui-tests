const assert = require('assert');

Feature('Test PMM server with srv local folder');

const basePmmUrl = 'http://127.0.0.1:8080/';

BeforeSuite(async ({ I }) => {
  // await I.verifyCommand('docker-compose -f docker-compose-srv.yml up -d');
  // await I.verifyCommand('docker exec pmm-client sh -c "pmm-admin add mysql --username=root --password=pass --query-source=perfschema  mysql5.7 mysql5.7:3306"');
  // await I.wait(120);
});

AfterSuite(async ({ I }) => {
  // await I.verifyCommand('docker-compose -f docker-compose-srv.yml down -v');
});

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1243 Verify PMM Server without data container @srv3',
  async ({
    I, homePage,
  }) => {
    I.amOnPage(basePmmUrl + homePage.url);
    let path;

    I.moveCursorTo(locate('li').find('a').withAttr({ 'aria-label': 'Help' }));
    I.waitForElement('//div[contains(text(), \'PMM Logs\')]', 3);

    await I.usePlaywrightTo('download', async ({ page }) => {
      const [download] = await Promise.all([
        // Start waiting for the download
        page.waitForEvent('download'),
        // Perform the action that initiates download
        page.locator('//div[contains(text(), \'PMM Logs\')]').click(),
      ]);

      // Wait for the download process to complete
      path = await download.path();
    });
    const logData = await I.readFileInZipArchive(path, 'pmm-agent.yaml');

    I.say(logData);
    await I.wait(15);
  },
);
