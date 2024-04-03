let config = require('codeceptjs').config.get();

Feature('Service Accounts tests');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario('@PMM-T1883', async ({ I, serviceAccountsPage, inventoryAPI }) => {
  await I.amOnPage(serviceAccountsPage.url);
  const pmmServerUrl = (await I.grabCurrentUrl()).replace(/^(-)|[^0-9.,]+/g, '$1');

  console.log(pmmServerUrl);
  await serviceAccountsPage.createServiceAccount(`service_account_${Date.now()}`, 'Editor');
  const tokenValue = await serviceAccountsPage.createServiceAccountToken(`token_name_${Date.now()}`);

  const oldAgentId = await I.verifyCommand('pmm-admin status | grep "Node ID" | awk -F " " \'{ print $4 }\'');

  console.log(oldAgentId);
  await inventoryAPI.deleteNode(oldAgentId, true);
  await I.amOnPage('');
  await I.wait(30);
  await I.saveScreenshot('debug1');
  const response = await I.verifyCommand(`pmm-agent setup --server-username=service_account --server-password=${tokenValue} --server-address=18.219.18.30 --server-insecure-tls`);

  console.log(response);
});
