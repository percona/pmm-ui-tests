const assert = require('assert');
const clusterName = 'minikube';
const pxc_cluster_name = 'upgrade-pxc';
const psmdb_cluster_name = 'upgrade-psmdb';
const active_state = 'ACTIVE';

// For running on local env set PMM_SERVER_LATEST and DOCKER_VERSION variables
function getVersions() {
  const [, pmmMinor, pmmPatch] = (process.env.PMM_SERVER_LATEST || '').split('.');
  const [, versionMinor, versionPatch] = process.env.DOCKER_VERSION
    ? (process.env.DOCKER_VERSION || '').split('.')
    : (process.env.SERVER_VERSION || '').split('.');

  const majorVersionDiff = pmmMinor - versionMinor;
  const patchVersionDiff = pmmPatch - versionPatch;
  const current = `2.${versionMinor}`;

  return {
    majorVersionDiff,
    patchVersionDiff,
    current,
    versionMinor,
  };
}

const { versionMinor, patchVersionDiff, majorVersionDiff } = getVersions();

Feature('Updates of DB clusters and operators and PMM Server upgrade related tests');

Before(async ({ I, dbaasAPI }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T726 Prepare Setup for DBaaS Instance Before Upgrade [blocker] @dbaas-upgrade ',
  async ({
    I, homePage, settingsAPI, dbaasAPI, pmmSettingsPage, dbaasPage,
  }) => {
    await settingsAPI.changeSettings({ publicAddress: process.env.VM_IP });
    if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
      await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    }

    await pmmSettingsPage.openAdvancedSettings();
    I.seeElement(pmmSettingsPage.fields.publicAddressButton);
    I.waitForVisible(pmmSettingsPage.fields.publicAddressInput, 30);
    I.seeElement(pmmSettingsPage.fields.publicAddressButton);
    const publicAddressValue = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

    assert.ok(publicAddressValue === process.env.VM_IP, `Expected the Public Address Input Field to be equal to ${process.env.VM_IP} but IP found as ${publicAddressValue}`);

    I.amOnPage(dbaasPage.url);
    dbaasPage.registerKubernetesCluster(clusterName, process.env.kubeconfig_minikube);
    // MySQL 8.0.20?
    await dbaasAPI.apiCreatePXCCluster(pxc_cluster_name, clusterName);
    // MongoDB 4.2.8?
    await dbaasAPI.apiCreatePSMDBCluster(psmdb_cluster_name, clusterName);
    await dbaasAPI.apiWaitForDBClusterState(pxc_cluster_name, clusterName, 'MySQL', 'DB_CLUSTER_STATE_READY');
    await dbaasAPI.apiWaitForDBClusterState(psmdb_cluster_name, clusterName, 'MongoDB', 'DB_CLUSTER_STATE_READY');
  },
).retry(0);

Scenario('PMM-T3 Upgrade PMM via UI with DbaaS Clusters @dbaas-upgrade', async ({
  I, homePage,
}) => {
  I.amOnPage(homePage.url);
  await homePage.upgradePMM(versionMinor, true);
});

Scenario('PMM-T726 Verify existing DB clusters status after PMM Server upgrade @dbaas-upgrade',
  async ({
    I, dbaasAPI, homePage, pmmSettingsPage, dbaasPage, dbaasActionsPage,
  }) => {
    I.amOnPage('graph/dbaas/dbclusters');
    I.waitForText(active_state, 10, dbaasPage.tabs.dbClusterTab.fields.clusterTableRow(pxc_cluster_name));
    I.waitForText(active_state, 10, dbaasPage.tabs.dbClusterTab.fields.clusterTableRow(psmdb_cluster_name));

    await dbaasPage.verifyLogPopup(33, psmdb_cluster_name);
    await dbaasPage.verifyLogPopup(6, pxc_cluster_name);
    await dbaasActionsPage.suspendCluster(psmdb_cluster_name, clusterName, 'MongoDB');
    await dbaasActionsPage.suspendCluster(pxc_cluster_name, clusterName);
    await dbaasActionsPage.resumeCluster(psmdb_cluster_name, clusterName, 'MongoDB');
    await dbaasActionsPage.resumeCluster(pxc_cluster_name, clusterName);
    await dbaasActionsPage.restartCluster(psmdb_cluster_name, clusterName, 'MongoDB');
    await dbaasActionsPage.restartCluster(pxc_cluster_name, clusterName, 'MySQL');

    const psmdb_updated_configuration = {
      topology: 'Cluster',
      resourcePerNode: 'Custom',
      memory: '1.1 GB',
      cpu: '0.4',
    };

    await dbaasActionsPage.editCluster(psmdb_cluster_name, clusterName, psmdb_updated_configuration);
    I.click(dbaasPage.tabs.dbClusterTab.updateClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent(psmdb_cluster_name));
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(psmdb_cluster_name));

    const pxc_updated_configuration = {
      topology: 'Single',
      resourcePerNode: 'Custom',
      memory: '1.1 GB',
      cpu: '0.4',
    };

    await dbaasActionsPage.editCluster(pxc_cluster_name, clusterName, pxc_updated_configuration);
    I.click(dbaasPage.tabs.dbClusterTab.updateClusterButton);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(pxc_cluster_name));
    await dbaasAPI.apiWaitForDBClusterState(pxc_cluster_name, clusterName, 'MySQL', 'DB_CLUSTER_STATE_READY');
    await dbaasAPI.apiWaitForDBClusterState(psmdb_cluster_name, clusterName, 'MongoDB', 'DB_CLUSTER_STATE_READY');
  });

const pxcDBClusterDetails = new DataTable(['namespace', 'clusterName', 'node']);

pxcDBClusterDetails.add(['default', `${pxc_cluster_name}`, '0']);

Data(pxcDBClusterDetails).Scenario('PMM-T726 Verify PXC cluster monitoring after PMM Server upgrade @dbaas-upgrade',
  async ({ dbaasPage, current }) => {
    const serviceName = `${current.namespace}-${current.clusterName}-pxc-${current.node}`;
    const haproxyNodeName = `${current.namespace}-${current.clusterName}-haproxy-${current.node}`;

    await dbaasPage.dbClusterAgentStatusCheck(pxc_cluster_name, serviceName, 'MYSQL_SERVICE');
    await dbaasPage.dbaasQANCheck(pxc_cluster_name, serviceName, serviceName, { from: 'now-5m' });
    await dbaasPage.pxcClusterMetricCheck(pxc_cluster_name, serviceName, serviceName, haproxyNodeName);
  });

const psmdbClusterDetails = new DataTable(['namespace', 'clusterName', 'node', 'nodeType']);

psmdbClusterDetails.add(['default', `${psmdb_cluster_name}`, '0', 'rs0']);
psmdbClusterDetails.add(['default', `${psmdb_cluster_name}`, '1', 'rs0']);
psmdbClusterDetails.add(['default', `${psmdb_cluster_name}`, '2', 'rs0']);
psmdbClusterDetails.add(['default', `${psmdb_cluster_name}`, '0', 'cfg']);
psmdbClusterDetails.add(['default', `${psmdb_cluster_name}`, '1', 'cfg']);
psmdbClusterDetails.add(['default', `${psmdb_cluster_name}`, '2', 'cfg']);

Data(psmdbClusterDetails).Scenario('PMM-T726 Verify PSMDB cluster monitoring after PMM Server upgrade @dbaas-upgrade',
  async ({
    I, dbaasAPI, dbaasPage, current,
  }) => {
    const serviceName = `${current.namespace}-${current.clusterName}-${current.nodeType}-${current.node}`;

    // run some load on mongodb to enable qan filters
    const {
      username, password, host,
    } = await dbaasAPI.apiGetDbClusterDetails(psmdb_cluster_name, clusterName, 'MongoDB');

    await I.verifyCommand(
      'kubectl run psmdb-client --image=percona/percona-server-mongodb:4.4.5-7 --restart=Never',
    );

    I.wait(20);
    await I.verifyCommand(
      'kubectl cp /srv/pmm-qa/pmm-tests/psmdb_cluster_connection_check.js psmdb-client:/tmp/',
    );
    await I.verifyCommand(
      `kubectl exec psmdb-client -- mongo "mongodb://${username}:${password}@${host}/admin?ssl=false" /tmp/psmdb_cluster_connection_check.js`,
    );

    await dbaasPage.dbClusterAgentStatusCheck(psmdb_cluster_name, serviceName, 'MONGODB_SERVICE');
    // await dbaasPage.dbaasQANCheck(psmdb_cluster_name, serviceName, serviceName, { from: 'now-5m' });
    await dbaasPage.psmdbClusterMetricCheck(psmdb_cluster_name, serviceName, serviceName);
    await I.verifyCommand(
      'kubectl delete pods psmdb-client',
      'pod "psmdb-client" deleted',
    );
  });

Scenario('PMM-T726 Verify removal of existing DB clusters after PMM Server upgrade @dbaas-upgrade',
  async ({ I, dbaasPage, dbaasActionsPage }) => {
    await dbaasPage.waitForDbClusterTab(clusterName);
    I.waitForInvisible(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton, 30);
    await dbaasActionsPage.deletePSMDBCluster(psmdb_cluster_name, clusterName);
    await dbaasActionsPage.deleteXtraDBCluster(pxc_cluster_name, clusterName);
  });

Scenario('PMM-T726 Verify creation and removal of new DB clusters after PMM Server upgrade @dbaas-upgrade',
  async ({
    I, dbaasPage, dbaasActionsPage, dbaasAPI,
  }) => {
    await dbaasPage.waitForDbClusterTab(clusterName);
    I.waitForInvisible(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton, 30);
    await dbaasActionsPage.createClusterBasicOptions(clusterName, `${psmdb_cluster_name}-new`, 'MongoDB');
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent(`${psmdb_cluster_name}-new`));
    await dbaasActionsPage.createClusterBasicOptions(clusterName, `${pxc_cluster_name}-new`, 'MySQL');
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent(`${pxc_cluster_name}-new`));
    await dbaasAPI.apiDeleteAllDBCluster(clusterName);
    await dbaasPage.waitForKubernetesClusterTab(clusterName);
    dbaasPage.unregisterCluster(clusterName);
    I.waitForText(dbaasPage.deletedAlertMessage, 20);
    dbaasPage.checkCluster(clusterName, true);
  });
