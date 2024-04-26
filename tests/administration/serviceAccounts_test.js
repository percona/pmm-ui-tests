Feature('Service Accounts tests');

Before(async ({ I }) => {
  await I.Authorize();
});

const serviceAccountUsername = `service_account_${Date.now()}`;
const newServiceName = 'mysql_service_service_token1';

Scenario('PMM-T1883 Configuring pmm-agent to use service account @service-account', async ({
  I, codeceptjsConfig, serviceAccountsPage, dashboardPage, inventoryAPI, nodesOverviewPage, credentials,
}) => {
  await I.amOnPage(serviceAccountsPage.url);
  const pmmServerUrl = new URL(codeceptjsConfig.config.helpers.Playwright.url).hostname;

  await serviceAccountsPage.createServiceAccount(serviceAccountUsername, 'Admin');
  const tokenValue = await serviceAccountsPage.createServiceAccountToken(`token_name_${Date.now()}`);
  const oldNodeId = await I.verifyCommand('pmm-admin status | grep "Node ID" | awk -F " " \'{ print $4 }\'');
  const pmmAgentConfigLocation = (await I.verifyCommand('sudo find / -name pmm-agent.yaml 2>/dev/null', null, 'notConsequential'))
    .split('\n')
    .find((agentLocation) => agentLocation.includes('/home/') || (agentLocation.includes('/usr/local/config/') || (agentLocation.includes('/usr/local/percona/pmm/') && !agentLocation.includes('docker'))));

  console.log(`Pmm agent config location is ${pmmAgentConfigLocation}`);
  if (oldNodeId) {
    await inventoryAPI.deleteNode(oldNodeId, true);
  }

  await I.verifyCommand(`sudo -E env "PATH=$PATH" pmm-agent setup --server-username=service_token --server-password=${tokenValue} --server-address=${pmmServerUrl} --server-insecure-tls --config-file=${pmmAgentConfigLocation}`);
  await I.wait(60);
  const nodeName = (await inventoryAPI.getAllNodes()).generic.find((node) => node.node_name !== 'pmm-server').node_name;
  const nodesUrl = I.buildUrlWithParams(nodesOverviewPage.url, {
    from: 'now-1m',
    to: 'now',
    service_name: nodeName,
  });

  await I.amOnPage(nodesUrl);
  await dashboardPage.waitForDashboardOpened();
  await dashboardPage.expandEachDashboardRow();
  await dashboardPage.verifyThereAreNoGraphsWithNA(1);
  await dashboardPage.verifyThereAreNoGraphsWithoutData(19);

  await I.verifyCommand('sudo docker restart pmm-server');
  await I.wait(60);
  await I.amOnPage(nodesOverviewPage.url);
  await dashboardPage.waitForDashboardOpened();
  await dashboardPage.expandEachDashboardRow();
  await dashboardPage.verifyThereAreNoGraphsWithNA(1);
  await dashboardPage.verifyThereAreNoGraphsWithoutData(19);
  await I.verifyCommand(`sudo docker exec -it ps_pmm_8.0  pmm-admin add mysql --username=msandbox --password=msandbox --host=127.0.0.1  --port=8033 --service-name=${newServiceName}`);
  await I.wait(60);
  const url = I.buildUrlWithParams(dashboardPage.mySQLInstanceOverview.clearUrl, {
    from: 'now-1m',
    to: 'now',
    service_name: newServiceName,
  });

  await I.amOnPage(url);
  await I.wait(5);
  await dashboardPage.verifyThereAreNoGraphsWithNA(1);
  await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
});

Scenario('PMM-T1884 Verify disabling service account @service-account', async ({ I, serviceAccountsPage }) => {
  await I.amOnPage(serviceAccountsPage.url);
  await serviceAccountsPage.disableServiceAccount(serviceAccountUsername);
  await I.wait(10);
  const responseDisabled = await I.verifyCommand('sudo -E env "PATH=$PATH" pmm-admin list', '', 'fail');
  const expectedDisabledMessage = 'Unauthorized. Please check username and password.';

  I.assertEqual(
    responseDisabled,
    expectedDisabledMessage,
    `Expected the message: '${expectedDisabledMessage} when sending command: 'pmm-admin list'. Actual message is: ${responseDisabled}`,
  );

  await serviceAccountsPage.enableServiceAccount(serviceAccountUsername);
  await I.wait(10);
  const responseEnabled = await I.verifyCommand('sudo -E env "PATH=$PATH" pmm-admin list');

  I.assertFalse(responseEnabled.includes(expectedDisabledMessage), 'Expected message for enabled user is not present');
});
