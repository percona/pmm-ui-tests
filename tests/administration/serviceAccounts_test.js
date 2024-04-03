Feature('Service Accounts tests');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario('@PMM-T1883', async ({
  I, serviceAccountsPage, dashboardPage, inventoryAPI, nodesOverviewPage,
}) => {
  await I.amOnPage(serviceAccountsPage.url);
  const pmmServerUrl = (await I.grabCurrentUrl()).replace(/^(-)|[^0-9.,]+/g, '$1');

  await serviceAccountsPage.createServiceAccount(`service_account_${Date.now()}`, 'Admin');
  const tokenValue = await serviceAccountsPage.createServiceAccountToken(`token_name_${Date.now()}`);

  const oldAgentId = await I.verifyCommand('pmm-admin status | grep "Node ID" | awk -F " " \'{ print $4 }\'');

  if (oldAgentId) {
    await inventoryAPI.deleteNode(oldAgentId, true);
  }

  await I.verifyCommand(`pmm-agent setup --server-username=service_token --server-password=${tokenValue} --server-address=${pmmServerUrl} --server-insecure-tls --config-file=/home/ec2-user/workspace/pmm3-aws-staging-start/pmm/config/pmm-agent.yaml --paths-base=/home/ec2-user/workspace/pmm3-aws-staging-start/pmm`);
  await I.wait(60);
  await I.amOnPage(nodesOverviewPage.url);
  await dashboardPage.waitForDashboardOpened();
  await dashboardPage.expandEachDashboardRow();
  await dashboardPage.verifyThereAreNoGraphsWithNA(1);
  await dashboardPage.verifyThereAreNoGraphsWithoutData(19);

  await I.verifyCommand('docker restart pmm-server');
  await I.wait(60);
  await I.amOnPage(nodesOverviewPage.url);
  await dashboardPage.waitForDashboardOpened();
  await dashboardPage.expandEachDashboardRow();
  await dashboardPage.verifyThereAreNoGraphsWithNA(1);
  await dashboardPage.verifyThereAreNoGraphsWithoutData(19);
});
