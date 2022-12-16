Feature('pmm-admin summary tests');

Scenario('PMM-T1219 - Verify pmm-admin summary includes targets from vmagent @cli', async ({ I }) => {
  await I.verifyCommand(
    'pmm-admin summary --filename=pmm-summary.zip',
    'pmm-summary.zip created.',
  );

  await I.verifyCommand('unzip -l pmm-summary.zip | grep vmagent-targets.json',
    'client/vmagent-targets.json');

  await I.verifyCommand('unzip -l pmm-summary.zip | grep vmagent-targets.html',
    'client/vmagent-targets.html');
});
