const config = require('codeceptjs').config.get();

Feature('Service Accounts tests');

Before(async ({ I }) => {
  await I.Authorize();
});

const serviceAccountUsername = `service_account_${Date.now()}`;

Scenario('PMM-T1883 Configuring pmm-agent to use service account @service-account', async ({
  I, serviceAccountsPage, dashboardPage, inventoryAPI, nodesOverviewPage,
}) => {
  await I.amOnPage(serviceAccountsPage.url);
  const pmmServerUrl = config.helpers.Playwright.url.replace(/^(-)|[^0-9.,]+/g, '$1');

  await serviceAccountsPage.createServiceAccount(serviceAccountUsername, 'Admin');
  const tokenValue = await serviceAccountsPage.createServiceAccountToken(`token_name_${Date.now()}`);
  const oldAgentId = await I.verifyCommand('pmm-admin status | grep "Node ID" | awk -F " " \'{ print $4 }\'');

  if (oldAgentId) {
    await inventoryAPI.deleteNode(oldAgentId, true);
  }

  const pmmAgentLocation = await I.verifyCommand('sudo find / -name pmm-agent.yaml');

  console.log(pmmAgentLocation);
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

  await I.verifyCommand('pmm-admin add mysql --username root --password GRgrO9301RuF --host=127.0.0.1 --port=43306');
  await I.wait(60);
  await I.amOnPage(dashboardPage.mySQLInstanceOverview.url);
  await dashboardPage.verifyThereAreNoGraphsWithNA(1);
  await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
});

Scenario('PMM-T1884 Verify disabling service account @service-account', async ({ I, serviceAccountsPage }) => {
  await I.amOnPage(serviceAccountsPage.url);
  await serviceAccountsPage.disableServiceAccount(serviceAccountUsername);
  await I.wait(10);
  const responseDisabled = await I.verifyCommand('pmm-admin list', '', 'fail');
  const expectedDisabledMessage = 'Unauthorized. Please check username and password.';

  I.assertEqual(
    responseDisabled,
    expectedDisabledMessage,
    `Expected the message: '${expectedDisabledMessage} when sending command: 'pmm-admin list'. Actual message is: ${responseDisabled}`,
  );

  await serviceAccountsPage.enableServiceAccount(serviceAccountUsername);
  await I.wait(10);
  const responseEnabled = await I.verifyCommand('pmm-admin list');

  I.assertFalse(responseEnabled.includes(expectedDisabledMessage), 'Expected message for enabled user is not present');
});
