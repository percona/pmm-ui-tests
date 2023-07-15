const assert = require('assert');

Feature('pmm-admin summary tests');

After(async ({ I }) => {
  await I.verifyCommand('rm -r pmm-summary.zip pmm-summary-logs || true');
});

Scenario('PMM-T1738 (1.0) - Verify downloading very big log file @cli', async ({ I, pmmSettingsPage }) => {
  await I.Authorize();
  I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
  await pmmSettingsPage.waitForPmmSettingsPageLoaded();
  await I.verifyCommand('docker exec pmm-server fallocate -l 100MB /srv/logs/clickhouse-server.log');
  await I.verifyCommand('rm -r PMMT1738* || true');
  await I.verifyCommand(`curl --user "${process.env.GRAFANA_USERNAME}:${process.env.GRAFANA_PASSWORD}" -v -k -X GET '${process.env.PMM_UI_URL}logs.zip' --output PMMT1738.zip`);
  I.wait(60);
  await I.verifyCommand('ls -la PMMT1738.zip');
  await I.verifyCommand('unzip -o PMMT1738.zip -d PMMT1738 > unzip_log');
  await I.verifyCommand('cat PMMT1738/clickhouse-server.log | grep -v "bufio.Scanner: token too long"');
});

Scenario('PMM-T1219 - Verify pmm-admin summary includes targets from vmagent @cli', async ({ I }) => {
  await I.verifyCommand(
    'pmm-admin summary --filename=pmm-summary.zip',
    'pmm-summary.zip created.',
  );

  await I.verifyCommand('unzip pmm-summary.zip -d pmm-summary-logs');
  await I.verifyCommand('unzip -l pmm-summary.zip | grep vmagent-targets.json',
    'client/vmagent-targets.json');

  await I.verifyCommand('unzip -l pmm-summary.zip | grep vmagent-targets.html',
    'client/vmagent-targets.html');
});

// unskip after https://jira.percona.com/browse/PMM-12152
Scenario.skip('@PMM-T1325 Verify that pmm-admin summary generates ZIP file, which contains separate log file for each exporter and agent @cli', async ({ I, pmmInventoryPage, inventoryAPI }) => {
  await I.verifyCommand('pmm-admin summary --filename=pmm-summary.zip', 'pmm-summary.zip created.');

  await I.verifyCommand('unzip pmm-summary.zip -d pmm-summary-logs');
  const clientAgents = await I.verifyCommand('ls pmm-summary-logs/client/pmm-agent | awk  \'BEGIN { FS = " |.log" } ; { print $2 }\' | awk NF');
  const serverAgents = await I.verifyCommand('ls pmm-summary-logs/server/client/pmm-agent | awk  \'BEGIN { FS = " |.log" } ; { print $2 }\' | awk NF');
  const agentsFromArchive = (clientAgents.split('\n').filter((r) => r !== '')).concat(serverAgents.split('\n').filter((r) => r !== ''));

  await I.Authorize();
  I.amOnPage(pmmInventoryPage.url);
  const actAg = await inventoryAPI.apiGetAgents();
  const agentsArr = [];

  for (const key of Object.keys(actAg.data)) {
    agentsArr.push(...actAg.data[key]);
  }

  const agentIdsArr = agentsArr.map((ag) => ag.agent_id.replace('/agent_id/', ''));

  I.assertEqual(agentsFromArchive.length, agentIdsArr.length, `The number of actual Agents doesn't match expected (Expected ${agentsFromArchive.length} but got ${agentIdsArr.length})`);

  agentsFromArchive.forEach((agentId) => {
    I.assertTrue(agentIdsArr.includes(agentId), `Actual Agents don't include expected agent_id (Expected ${agentId} but didn't found)`);
  });
});

Scenario('@PMM-T1353 Verify pmm-admin summary doesn\'t save any credentials in files @cli', async ({ I, pmmInventoryPage }) => {
  await I.verifyCommand('pmm-admin summary --filename=pmm-summary.zip', 'pmm-summary.zip created.');

  await I.verifyCommand('unzip pmm-summary.zip -d pmm-summary-logs');
  const pmmServerUrl = await I.verifyCommand('cat pmm-summary-logs/client/status.json | grep \'"https://x*:x*@.*:.*"\'');

  I.assertNotEqual(pmmServerUrl, '', 'PMM server url does not match masked version. Login and password could be in danger.');
});
