let config = require('codeceptjs').config.get();

Feature('Service Accounts tests');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario('@PMM-T1883', async ({ I, serviceAccountsPage, inventoryAPI }) => {
  await I.amOnPage(serviceAccountsPage.url);
  const pmmServerUrl = (await I.grabCurrentUrl()).replace(/^(-)|[^0-9.,]+/g, '$1');

  console.log(pmmServerUrl);
  await serviceAccountsPage.createServiceAccount(`service_account_${Date.now()}`, 'Admin');
  const tokenValue = await serviceAccountsPage.createServiceAccountToken(`token_name_${Date.now()}`);

  const oldAgentId = await I.verifyCommand('pmm-admin status | grep "Node ID" | awk -F " " \'{ print $4 }\'');

  if (oldAgentId) {
    console.log(oldAgentId);
    console.log(`Length of old agent id is: ${oldAgentId.length}`);
    await inventoryAPI.deleteNode(oldAgentId, true);
  }

  await I.amOnPage('');
  await I.wait(30);
  await I.saveScreenshot('debug1');
  const response = await I.verifyCommand(`pmm-agent setup --server-username=service_token --server-password=${tokenValue} --server-address=${pmmServerUrl} --server-insecure-tls`);

  console.log(response);
});
