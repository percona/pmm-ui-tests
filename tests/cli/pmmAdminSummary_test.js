const assert = require('assert');

Feature('pmm-admin summary tests');

After(async ({ I }) => {
  await I.verifyCommand('rm -r pmm-summary.zip pmm-summary-logs');
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
