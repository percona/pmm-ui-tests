const assert = require('assert');

const { dbaasAPI, dbaasPage } = inject();
const clusterName = 'minikube';
const pxc_cluster_name = 'pxc-dbcluster';
const pxc_cluster_type = 'DB_CLUSTER_TYPE_PXC';
const mysql_recommended_version = 'MySQL 8.0.27';

const pxcDBClusterDetails = new DataTable(['namespace', 'clusterName', 'node']);

// only to details in current object for each node check
pxcDBClusterDetails.add(['default', `${pxc_cluster_name}`, '0']);
pxcDBClusterDetails.add(['default', `${pxc_cluster_name}`, '1']);
pxcDBClusterDetails.add(['default', `${pxc_cluster_name}`, '2']);

Feature('DbaaS: PXC Cluster Creation, Modifications, Actions, Verification tests');

const singleNodeConfiguration = {
  topology: 'Single',
  numberOfNodes: '1',
  resourcePerNode: 'Custom',
  memory: '1.2 GB',
  cpu: '0.2',
  disk: '25 GB',
  dbType: mysql_recommended_version,
};

BeforeSuite(async ({ dbaasAPI }) => {
  if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
    await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
  }
});

AfterSuite(async ({ dbaasAPI }) => {
  await dbaasAPI.apiUnregisterCluster(clusterName, true);
});

Before(async ({ I, dbaasAPI }) => {
  await I.Authorize();
  if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
    await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
  }
});

Scenario('PMM-T665 PMM-T455 PMM-T575 Verify that Advanced Options are optional for DB Cluster Creation, '
  + 'creating PXC cluster with default settings, log popup @dbaas',
async ({
  I, dbaasPage, dbaasAPI, dbaasActionsPage,
}) => {
  await dbaasAPI.deleteAllDBCluster(clusterName);
  I.amOnPage(dbaasPage.url);
  await dbaasActionsPage.createClusterBasicOptions(clusterName, pxc_cluster_name, 'MySQL');
  I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
  I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
  await dbaasPage.postClusterCreationValidation(pxc_cluster_name, clusterName);
  await dbaasPage.verifyLogPopup(18);
});

Scenario(
  'PMM-T486 Verify Adding PMM-Server Public Address via Settings works, ' 
  + 'PMM-T1315 - Verify DBaaS naming @dbaas',
  async ({ I, pmmSettingsPage, settingsAPI }) => {
    await settingsAPI.changeSettings({ publicAddress: '' });
    await pmmSettingsPage.openAdvancedSettings();
    await pmmSettingsPage.verifyTooltip(pmmSettingsPage.tooltips.advancedSettings.publicAddress);
    I.waitForVisible(pmmSettingsPage.fields.publicAddressInput, 30);
    I.seeElement(pmmSettingsPage.fields.publicAddressButton);
    I.seeTextEquals('Database as a Service (DBaaS)', pmmSettingsPage.fields.dbaasSwitchItem);
    I.click(pmmSettingsPage.fields.publicAddressButton);
    let publicAddress = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

    I.assertEqual(
      publicAddress,
      process.env.VM_IP,
      `Expected the Public Address Input Field to Match ${process.env.VM_IP} but found ${publicAddress}`,
    );
    pmmSettingsPage.applyChanges();
    I.refreshPage();
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    publicAddress = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);
    I.assertEqual(
      publicAddress,
      process.env.VM_IP,
      `Expected the Public Address to be saved and Match ${process.env.VM_IP} but found ${publicAddress}`,
    );
  },
);

Scenario('PMM-T582 Verify Adding Cluster with Same Name and Same DB Type @dbaas', async ({ I, dbaasPage, dbaasActionsPage }) => {
  I.amOnPage(dbaasPage.url);
  await dbaasActionsPage.createClusterBasicOptions(clusterName, pxc_cluster_name, 'MySQL');
  I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
  await dbaasPage.seeErrorForAddedDBCluster(pxc_cluster_name);
});

Scenario(
  'PMM-T717 Verify insufficient resources warning @dbaas',
  async ({
    I, dbaasPage, dbaasActionsPage,
  }) => {
    const pxc_resource_check_cluster_name = 'PXC-Check-Resources';
    const pxc_configuration = {
      topology: 'Cluster',
      numberOfNodes: '1',
      resourcePerNode: 'Custom',
      memory: '50 GB',
      cpu: '20',
      disk: '120 GB',
      dbType: 'MySQL',
      clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.pxcDashboard(pxc_resource_check_cluster_name),
    };

    I.amOnPage(dbaasPage.url);
    await dbaasActionsPage.createClusterAdvancedOption(clusterName, pxc_resource_check_cluster_name, 'MySQL', pxc_configuration);
    await dbaasActionsPage.verifyInsufficientResources(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourceBarCPU, 'Insufficient CPU');
    await dbaasActionsPage.verifyInsufficientResources(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourceBarMemory, 'Insufficient Memory');
    await dbaasActionsPage.verifyInsufficientResources(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourceBarDisk, 'Insufficient Disk');
  },
);

Scenario(
  'PMM-T502 Verify monitoring of PXC cluster @dbaas',
  async ({ I, dbaasPage, dashboardPage, qanFilters, qanPage, qanOverview }) => {
    I.amOnPage(dbaasPage.url);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 30);
    await dashboardPage.genericDashboardLoadForDbaaSClusters(
      `${dashboardPage.pxcGaleraClusterSummaryDashboard.url}&var-cluster=${pxc_cluster_name}-pxc`, 'Last 15 minutes', 4, 0, 2);
    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-3h' }));
    qanOverview.waitForOverviewLoaded();
    qanFilters.checkFilterExistInSection('Cluster', pxc_cluster_name);
  },
);

Data(pxcDBClusterDetails).Scenario(
  'PMM-T502 Verify monitoring of PXC service and node @dbaas',
  async ({ I, dbaasPage, current }) => {
    I.amOnPage(dbaasPage.url);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 30);
    const serviceName = `${current.namespace}-${current.clusterName}-pxc-${current.node}`;
    const haproxyNodeName = `${current.namespace}-${current.clusterName}-haproxy-${current.node}`;

    await dbaasPage.dbaasQANCheck(pxc_cluster_name, serviceName, serviceName);
    await dbaasPage.pxcClusterMetricCheck(pxc_cluster_name, serviceName, serviceName, haproxyNodeName);
    await dbaasPage.dbClusterAgentStatusCheck(pxc_cluster_name, serviceName, 'MYSQL_SERVICE');
  },
);

Scenario(
'PMM-T459 Verify DB Cluster Details are listed '
    + 'PMM-T473 Verify shortcut link for DB Clusters '
    + 'PMM-T478 Verify Hide Password button on DB cluster page '
    + 'PMM-T485 Verify user can restart Percona PXC cluster @dbaas',
  async ({ I, dbaasPage, dbaasActionsPage }) => {
    const clusterDetails = {
      clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.pxcDashboard(pxc_cluster_name),
      dbType: mysql_recommended_version,
      memory: '2 GB',
      cpu: '1',
      disk: '25 GB',
    };

    I.amOnPage(dbaasPage.url);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterTableHeader, 30);
    await dbaasPage.validateClusterDetail(
      pxc_cluster_name,
      clusterName,
      clusterDetails,
      clusterDetails.clusterDashboardRedirectionLink,
    );
    await dbaasActionsPage.restartCluster(pxc_cluster_name, clusterName, 'MySQL');
    await dbaasPage.validateClusterDetail(
      pxc_cluster_name,
      clusterName,
      clusterDetails,
      clusterDetails.clusterDashboardRedirectionLink,
    );
  },
);

Scenario('PMM-T460, PMM-T452 Verify force unregistering Kubernetes cluster @dbaas',
  async ({ I, dbaasPage }) => {
    I.amOnPage(dbaasPage.url);
    await dbaasPage.goToKubernetesClusterTab();
    dbaasPage.unregisterCluster(clusterName);
    I.waitForText(dbaasPage.failedUnregisterCluster(clusterName, 'PXC'));
    dbaasPage.unregisterCluster(clusterName, true);
    I.waitForText(dbaasPage.deletedAlertMessage, 20);
    dbaasPage.checkCluster(clusterName, true);
  });

Scenario('PMM-T524 Delete PXC Cluster and Unregister K8s Cluster @dbaas',
  async ({ I, dbaasPage, dbaasActionsPage }) => {
    I.amOnPage(dbaasPage.url);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 30);
    await dbaasActionsPage.deleteXtraDBCluster(pxc_cluster_name, clusterName);
  });

Scenario('PMM-T640 PMM-T479 Single Node PXC Cluster with Custom Resources, PMM-T780 Verify API keys are created when DB '
 + 'cluster is created, PMM-T781 Verify API keys are deleted when DB cluster is deleted  @dbaas',
async ({
  I, dbaasPage, dbaasActionsPage, dbaasAPI,
}) => {
  const dbClusterRandomName = dbaasPage.randomizeClusterName(pxc_cluster_name);
  const dbClusterRandomNameLink = dbaasPage.clusterDashboardUrls.pxcDashboard(dbClusterRandomName);

  await dbaasAPI.deleteAllDBCluster(clusterName);
  I.amOnPage(dbaasPage.url);
  await dbaasActionsPage.createClusterAdvancedOption(clusterName, dbClusterRandomName, 'MySQL', singleNodeConfiguration);
  I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
  I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
  // PMM-T780
  await dbaasPage.apiKeyCheck(clusterName, dbClusterRandomName, 'pxc', true);
  I.amOnPage(dbaasPage.url);
  await dbaasPage.postClusterCreationValidation(dbClusterRandomName, clusterName);
  await dbaasPage.validateClusterDetail(dbClusterRandomName, clusterName, singleNodeConfiguration, dbClusterRandomNameLink);
  const {
    username, password, host, port,
  } = await dbaasAPI.getDbClusterDetails(dbClusterRandomName, clusterName);
  const output = await I.verifyCommand(
    `kubectl run -i --rm --tty pxc-client --image=percona:8.0 --restart=Never -- mysql -h ${host} -u${username} -p${password} -e "SHOW DATABASES;"`,
    'performance_schema',
  );

  await dbaasActionsPage.deleteXtraDBCluster(dbClusterRandomName, clusterName);
  // PMM-T781
  await dbaasPage.apiKeyCheck(clusterName, dbClusterRandomName, 'pxc', false);
});

Scenario('PMM-T522 Verify Editing a Cluster with Custom Setting and float values is possible @dbaas',
  async ({
    I, dbaasPage, dbaasActionsPage, dbaasAPI,
  }) => {
    const dbClusterRandomName = dbaasPage.randomizeClusterName(pxc_cluster_name);

    await dbaasAPI.deleteAllDBCluster(clusterName);
    I.amOnPage(dbaasPage.url);
    await dbaasActionsPage.createClusterBasicOptions(clusterName, dbClusterRandomName, 'MySQL');
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasPage.postClusterCreationValidation(dbClusterRandomName, clusterName);
    const configuration = {
      topology: 'Single',
      resourcePerNode: 'Custom',
      memory: '1.2 GB',
      cpu: '0.2',
      disk: '25 GB',
      dbType: 'MySQL',
      clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.pxcDashboard(dbClusterRandomName),
    };

    await dbaasActionsPage.editCluster(dbClusterRandomName, clusterName, configuration);
    I.click(dbaasPage.tabs.dbClusterTab.updateClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasPage.postClusterCreationValidation(dbClusterRandomName, clusterName);
    await dbaasPage.validateClusterDetail(dbClusterRandomName, clusterName, singleNodeConfiguration,
      configuration.clusterDashboardRedirectionLink);
    await dbaasActionsPage.deleteXtraDBCluster(dbClusterRandomName, clusterName);
  });

Scenario('PMM-T488, PMM-T489 Verify editing PXC cluster changing single node to 3 nodes topology, editing cluster only possible when cluster is active @dbaas',
  async ({
    I, dbaasPage, dbaasActionsPage, dbaasAPI,
  }) => {
    const dbClusterRandomName = dbaasPage.randomizeClusterName(pxc_cluster_name);
    const updatedConfiguration = {
      topology: 'Cluster',
      numberOfNodes: '3',
      resourcePerNode: 'Custom',
      memory: '1 GB',
      cpu: '0.5',
      disk: '25 GB',
      dbType: mysql_recommended_version,
      clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.pxcDashboard(dbClusterRandomName),
    };

    await dbaasAPI.deleteAllDBCluster(clusterName);
    I.amOnPage(dbaasPage.url);
    await dbaasActionsPage.createClusterAdvancedOption(clusterName, dbClusterRandomName, 'MySQL', singleNodeConfiguration);
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasPage.postClusterCreationValidation(dbClusterRandomName, clusterName);
    await dbaasPage.validateClusterDetail(dbClusterRandomName, clusterName, singleNodeConfiguration,
      updatedConfiguration.clusterDashboardRedirectionLink);
    await dbaasActionsPage.editCluster(dbClusterRandomName, clusterName, updatedConfiguration);
    I.click(dbaasPage.tabs.dbClusterTab.updateClusterButton);
    I.waitForText('Processing', 60, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasPage.postClusterCreationValidation(dbClusterRandomName, clusterName);
    await dbaasPage.validateClusterDetail(dbClusterRandomName, clusterName, updatedConfiguration,
      updatedConfiguration.clusterDashboardRedirectionLink);
    await dbaasActionsPage.deleteXtraDBCluster(dbClusterRandomName, clusterName);
  });

Scenario('PMM-T525 PMM-T528 Verify Suspend & Resume for DB Cluster Works as expected @dbaas',
  async ({ I, dbaasPage, dbaasActionsPage }) => {
    const dbClusterRandomName = dbaasPage.randomizeClusterName(pxc_cluster_name);
    const dbClusterRandomNameLink = dbaasPage.clusterDashboardUrls.pxcDashboard(dbClusterRandomName);
    const clusterDetails = {
      dbType: mysql_recommended_version,
      memory: '2 GB',
      cpu: '1',
      disk: '25 GB',
    };

    await dbaasAPI.deleteAllDBCluster(clusterName);
    I.amOnPage(dbaasPage.url);
    await dbaasActionsPage.createClusterBasicOptions(clusterName, dbClusterRandomName, 'MySQL');
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasPage.postClusterCreationValidation(dbClusterRandomName, clusterName);
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu);
    await dbaasActionsPage.checkActionPossible('Update', false);
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu);
    await dbaasActionsPage.suspendCluster(dbClusterRandomName, clusterName);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterStatusPaused, 60);
    I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusPaused);
    await dbaasActionsPage.resumeCluster(dbClusterRandomName, clusterName);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive, 60);
    I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive);
    await dbaasPage.validateClusterDetail(dbClusterRandomName, clusterName, clusterDetails, dbClusterRandomNameLink);
    await dbaasActionsPage.deleteXtraDBCluster(dbClusterRandomName, clusterName);
  });

Scenario('PMM-T704 PMM-T772 PMM-T849 PMM-T850 Resources, PV, Secrets verification @dbaas',
  async ({
    I, dbaasPage, dbaasAPI, dbaasActionsPage, adminPage,
  }) => {
    const dbClusterRandomName = dbaasPage.randomizeClusterName(pxc_cluster_name);
    const pxc_configuration = {
      topology: 'Cluster',
      numberOfNodes: '1',
      resourcePerNode: 'Custom',
      memory: '1 GB',
      cpu: '1',
      disk: '3 GB',
      dbType: 'MySQL',
      clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.pxcDashboard(
        dbClusterRandomName,
      ),
    };

    await dbaasAPI.deleteAllDBCluster(clusterName);
    I.amOnPage(dbaasPage.url);
    await dbaasActionsPage.createClusterAdvancedOption(clusterName, dbClusterRandomName, 'MySQL', pxc_configuration);
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasPage.postClusterCreationValidation(dbClusterRandomName, clusterName);
    const {
      username, password, host, port,
    } = await dbaasAPI.getDbClusterDetails(dbClusterRandomName, clusterName);

    await I.verifyCommand(
      `kubectl get pods ${dbClusterRandomName}-pxc-0 -o json | grep -i requests -A2 | tail -2`,
      '"cpu": "1"',
    );
    await I.verifyCommand(
      `kubectl get pods ${dbClusterRandomName}-pxc-0 -o json | grep -i requests -A2 | tail -2`,
      '"memory": "1G"',
    );
    await I.verifyCommand(
      `kubectl get pv | grep ${dbClusterRandomName}`,
      dbClusterRandomName,
    );

    await I.verifyCommand(
      `kubectl get secrets | grep dbaas-${dbClusterRandomName}-pxc-secrets`,
      dbClusterRandomName,
    );

    await I.verifyCommand(
      `kubectl get secrets dbaas-${dbClusterRandomName}-pxc-secrets -o yaml | grep root: | awk '{print $2}' | base64 --decode`,
      password,
    );
    await dbaasAPI.apiDeleteDBCluster(dbClusterRandomName, clusterName, pxc_cluster_type);
    await dbaasAPI.waitForDbClusterDeleted(dbClusterRandomName, clusterName);
    await I.verifyCommand(
      `kubectl get pv | grep ${dbClusterRandomName}`,
      'No resources found',
      'fail',
    );
    await I.verifyCommand(
      `kubectl get secrets | grep dbaas-${dbClusterRandomName}-pxc-secrets`,
      '',
      'fail',
    );
  });

Scenario('Verify update PXC DB Cluster version @dbaas', async ({ I, dbaasPage, dbaasActionsPage }) => {
  const mysqlVersion = '8.0.19-10.1';
  const dbClusterRandomName = dbaasPage.randomizeClusterName(pxc_cluster_name);

  await dbaasAPI.deleteAllDBCluster(clusterName);
  await dbaasAPI.createCustomPXC(clusterName, dbClusterRandomName, '1', `percona/percona-xtradb-cluster:${mysqlVersion}`);
  await dbaasAPI.waitForDBClusterState(dbClusterRandomName, clusterName, 'MySQL', 'DB_CLUSTER_STATE_READY');
  I.amOnPage(dbaasPage.url);
  // await dbaasPage.postClusterCreationValidation(dbClusterRandomName, clusterName);

  const {
    username, password, host, port,
  } = await dbaasAPI.getDbClusterDetails(dbClusterRandomName, clusterName);

  await I.verifyCommand(
    `kubectl run -i --rm --tty pxc-client --image=percona:8.0 --restart=Never -- mysql -h ${host} -u${username} -p${password} -e "CREATE DATABASE DBAAS_UPGRADE_TESTING;"`,
  );
  await I.verifyCommand(
    `kubectl run -i --rm --tty pxc-client --image=percona:8.0 --restart=Never -- mysql -h ${host} -u${username} -p${password} -e "SHOW DATABASES;"`,
    'DBAAS_UPGRADE_TESTING',
  );

  await dbaasActionsPage.updateCluster();
  I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterStatusUpdating, 60);
  I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusUpdating);
  await dbaasAPI.waitForDBClusterState(dbClusterRandomName, clusterName, 'MySQL', 'DB_CLUSTER_STATE_READY');
  I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive, 60);
  I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive);
  await I.verifyCommand(
    `kubectl run -i --rm --tty pxc-client --image=percona:8.0 --restart=Never -- mysql -h ${host} -u${username} -p${password} -e "SHOW DATABASES;"`,
    'DBAAS_UPGRADE_TESTING',
  );
  const version = await I.verifyCommand(
    `kubectl run -i --rm --tty pxc-client --image=percona:8.0 --restart=Never -- mysql -h ${host} -u${username} -p${password} -e "SELECT VERSION();"`,
  );

  assert.ok(!version.includes(mysqlVersion), `Expected Version for PXC Cluster After Upgrade ${version} should not be same as Before Update Operation`);
  await dbaasActionsPage.deleteXtraDBCluster(dbClusterRandomName, clusterName);
});

Scenario(
  'PMM-T509 Verify Deleting Db Cluster in Pending Status is possible @dbaas',
  async ({ I, dbaasPage, dbaasActionsPage }) => {
    const pxc_cluster_pending_delete = 'pxc-pending-delete';

    await dbaasAPI.deleteAllDBCluster(clusterName);
    I.amOnPage(dbaasPage.url);
    await dbaasActionsPage.createClusterBasicOptions(clusterName, pxc_cluster_pending_delete, 'MySQL');
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 60, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasActionsPage.deleteXtraDBCluster(pxc_cluster_pending_delete, clusterName);
  },
);
