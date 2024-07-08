const { codeceptjsConfig } = inject();
const assert = require('assert');

Feature('Logs tests');

const filename = 'logs.zip';
const fileNameToCheck = 'pmm-managed.log';
const baseUrl = codeceptjsConfig.config.helpers.Playwright.url;

Scenario('Verify no line_count parameter when downloading logs @nightly', async ({ I, codeceptjsConfig }) => {
  const outputPath = await I.downloadZipFile(`${baseUrl}/logs.zip`, filename);
  const actualLineCount = I.getFileLineCount(outputPath, fileNameToCheck);

  assert.ok(actualLineCount === 50001, `File ${fileNameToCheck} has ${actualLineCount} lines, but expected 50001`);
});

// @settings-fb tag added in order to execute this test on FB
Scenario('Verify line_count=10 parameter when downloading logs @settings-fb @nightly', async ({ I, codeceptjsConfig }) => {
  const outputPath = await I.downloadZipFile(`${baseUrl}/logs.zip?line-count=10`, filename);
  const actualLineCount = I.getFileLineCount(outputPath, fileNameToCheck);

  assert.ok(actualLineCount === 11, `File ${fileNameToCheck} has ${actualLineCount} lines, but expected 11`);
});

Scenario('Verify line_count=-1 parameter when downloading logs @nightly', async ({ I, codeceptjsConfig }) => {
  const outputPath = await I.downloadZipFile(`${baseUrl}/logs.zip?line-count=-1`, filename);
  const actualLineCount = I.getFileLineCount(outputPath, fileNameToCheck);

  assert.ok(actualLineCount > 50001, `File ${fileNameToCheck} has ${actualLineCount} lines, but expected more than 50001`);
});
