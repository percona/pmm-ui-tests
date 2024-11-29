const { codeceptjsConfig, I } = inject();
const assert = require('assert');

Feature('Logs tests');

const filename = 'logs.zip';
const fileNameToCheck = 'pmm-managed.log';
const baseUrl = codeceptjsConfig.config.helpers.Playwright.url;

const getLineCount = async () => Number(await I.verifyCommand('docker exec pmm-server cat /srv/logs/pmm-managed.log | wc -l'));

BeforeSuite(async ({ I, locationsAPI }) => {
  let actualLineCount = await getLineCount();
  // Simple request to generate > 50k lines in logs

  while (actualLineCount < 50001) {
    for (let i = 0; i < 1000; i++) {
      await locationsAPI.getLocationsList();
    }

    I.wait(5);

    actualLineCount = await getLineCount();
  }
});

// @settings-fb tag added in order to execute these tests on FB

Scenario('PMM-T1902 Verify no line_count parameter when downloading logs @settings-fb', async ({ I }) => {
  const outputPath = await I.downloadZipFile(`${baseUrl}/logs.zip`, filename);
  const actualLineCount = I.getFileLineCount(outputPath, fileNameToCheck);

  assert.ok(actualLineCount === 50001, `File ${fileNameToCheck} has ${actualLineCount} lines, but expected 50001`);
});

Scenario('PMM-T1903 Verify line_count=10 parameter when downloading logs @settings-fb', async ({ I }) => {
  const outputPath = await I.downloadZipFile(`${baseUrl}/logs.zip?line-count=10`, filename);
  const actualLineCount = I.getFileLineCount(outputPath, fileNameToCheck);

  assert.ok(actualLineCount === 11, `File ${fileNameToCheck} has ${actualLineCount} lines, but expected 11`);
});

Scenario('PMM-T1904 Verify line_count=-1 parameter when downloading logs @settings-fb', async ({ I }) => {
  const outputPath = await I.downloadZipFile(`${baseUrl}/logs.zip?line-count=-1`, filename);
  const actualLineCount = I.getFileLineCount(outputPath, fileNameToCheck);

  assert.ok(actualLineCount > 50001, `File ${fileNameToCheck} has ${actualLineCount} lines, but expected more than 50001`);
});
