const { dbaasAPI, dbaasPage } = inject();
const clusterName = 'minikube';
const psmdb_cluster = 'psmdb-cluster';
const assert = require('assert');

const psmdb_cluster_type = 'DB_CLUSTER_TYPE_PSMDB';
const mongodb_recommended_version = 'MongoDB 4.4.10';
const mongodb_updated_version = 'MongoDB 5.0.2';

// const psmdbClusterDetails = new DataTable(['namespace', 'clusterName', 'node', 'nodeType']);

// only to details in current object for each node check
// psmdbClusterDetails.add(['default', `${psmdb_cluster}`, '0', 'rs0']);
// psmdbClusterDetails.add(['default', `${psmdb_cluster}`, '1', 'rs0']);
// psmdbClusterDetails.add(['default', `${psmdb_cluster}`, '2', 'rs0']);
// psmdbClusterDetails.add(['default', `${psmdb_cluster}`, '0', 'cfg']);
// psmdbClusterDetails.add(['default', `${psmdb_cluster}`, '1', 'cfg']);
// psmdbClusterDetails.add(['default', `${psmdb_cluster}`, '2', 'cfg']);

const psmdb_configuration = {
  topology: 'Cluster',
  numberOfNodes: '1',
  resourcePerNode: 'Custom',
  memory: '2 GB',
  cpu: '1',
  disk: '5 GB',
  dbType: mongodb_recommended_version,
  clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.psmdbDashboard(psmdb_cluster),
};

const psmdb_configuration_after_update = {
  topology: 'Cluster',
  numberOfNodes: '1',
  resourcePerNode: 'Custom',
  memory: '2 GB',
  cpu: '1',
  disk: '5 GB',
  dbType: mongodb_updated_version,
  clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.psmdbDashboard(psmdb_cluster),
};

Feature('DBaaS: MongoDB Cluster Creation, Modifications, Actions, Verification tests');

BeforeSuite(async ({ dbaasAPI, settingsAPI }) => {
  await settingsAPI.changeSettings({ publicAddress: process.env.VM_IP });
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

// These test covers a lot of cases, will be refactored and changed in terms of flow, this is initial setup

Scenario('PMM-T665 PMM-T642 PSMDB Cluster with Custom Resources, log popup ' + 
'PMM-T780 Verify API keys are created when DB cluster is created @dbaas',
  async ({
    I, dbaasPage, dbaasAPI, dbaasActionsPage,
  }) => {
    const collectionNames = '[ "customers" ]';
    const dbName = 'tutorialkart2';

    await dbaasAPI.deleteAllDBCluster(clusterName);
    await dbaasAPI.waitForClusterStatus();
    I.amOnPage(dbaasPage.url);
    await dbaasActionsPage.createClusterAdvancedOption(clusterName, psmdb_cluster, 'MongoDB', psmdb_configuration);
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent(psmdb_cluster));
    //PMM-T780
    await dbaasPage.apiKeyCheck(clusterName, psmdb_cluster, 'psmdb', true);
    I.amOnPage(dbaasPage.url);
    await dbaasPage.postClusterCreationValidation(psmdb_cluster, clusterName, 'MongoDB');
    //PMM-T665
    await dbaasPage.verifyLogPopup(27, psmdb_cluster);
    await dbaasPage.validateClusterDetail(psmdb_cluster, clusterName, psmdb_configuration, 
      psmdb_configuration.clusterDashboardRedirectionLink);
    const {
      username, password, host, port,
    } = await dbaasAPI.getDbClusterDetails(psmdb_cluster, clusterName, 'MongoDB');

    await I.verifyCommand(
      'kubectl run psmdb-client --image=percona/percona-server-mongodb:4.4.5-7 --restart=Never',
    );

    // wait for psmdb-client pod to startup, to improve with cmd helper wait for expected output on list pods
    I.wait(20);
    await I.verifyCommand(
      'kubectl cp /srv/pmm-qa/pmm-tests/psmdb_cluster_connection_check.js psmdb-client:/tmp/',
    );
    const output = await I.verifyCommand(
      `kubectl exec psmdb-client -- mongo "mongodb://${username}:${password}@${host}/admin?ssl=false" /tmp/psmdb_cluster_connection_check.js`,
    );

    assert.ok(output.includes(collectionNames), `The ${output} for psmdb cluster setup dump was expected to have collection names ${collectionNames}, but found ${output}`);
    assert.ok(output.includes(dbName), `The ${output} for psmdb cluster setup dump was expected to have db name ${dbName}, but found ${output}`);

    await I.verifyCommand(
      'kubectl delete pods psmdb-client',
      'pod "psmdb-client" deleted',
    );
  });

Scenario(
  'PMM-T525 PMM-T528 Verify Suspend & Resume for Mongo DB Cluster Works as expected @dbaas',
  async ({ I, dbaasPage, dbaasActionsPage }) => {
    I.amOnPage(dbaasPage.url);
    await dbaasActionsPage.suspendCluster(psmdb_cluster, clusterName, 'MongoDB');
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterStatusPaused, 60);
    I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusPaused);
    await dbaasActionsPage.resumeCluster(psmdb_cluster, clusterName, 'MongoDB');
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive, 60);
    I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive);
    await dbaasPage.validateClusterDetail(
      psmdb_cluster,
      clusterName,
      psmdb_configuration,
      psmdb_configuration.clusterDashboardRedirectionLink,
    );
  },
);

Scenario('Verify update PSMDB Cluster version @dbaas', async ({ I, dbaasPage, dbaasActionsPage }) => {
  I.amOnPage(dbaasPage.url);
  await dbaasActionsPage.updateCluster(psmdb_cluster);
  I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent(psmdb_cluster));
  await dbaasAPI.waitForDBClusterState(psmdb_cluster, clusterName, 'MongoDB', 'DB_CLUSTER_STATE_READY');
  // I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive, 120);
  // I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive);
});

Scenario(
  'PMM-T503 PMM-T477 Verify monitoring of PSMDB cluster, '
    + 'PMM-T484 PMM-T461 Verify MongoDB Cluster can be restarted, '
    + 'PMM-T460 unregister k8s Cluster when Db Cluster Exist',
  async ({ I, dbaasPage, dbaasActionsPage, dashboardPage, qanOverview, qanPage, qanFilters }) => {
    //PMM-T503
    await dashboardPage.genericDashboardLoadForDbaaSClusters(
      `${dashboardPage.mongoDbClusterSummaryDashboard.url}?&var-cluster=${psmdb_cluster}`,
      'Last 15 minutes', 4, 0, 15,
    );
    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-3h' }));
    qanOverview.waitForOverviewLoaded();
    qanFilters.checkFilterExistInSection('Cluster', psmdb_cluster);
    //PMM-T460
    await dbaasPage.waitForKubernetesClusterTab(clusterName);
    dbaasPage.unregisterCluster(clusterName);
    I.waitForText(dbaasPage.failedUnregisterCluster(clusterName));
    //PMM-T484
    I.amOnPage(dbaasPage.url);
    await dbaasActionsPage.restartCluster(psmdb_cluster, clusterName, 'MongoDB');
    await dbaasPage.validateClusterDetail(
      psmdb_cluster,
      clusterName,
      psmdb_configuration_after_update,
      psmdb_configuration_after_update.clusterDashboardRedirectionLink,
    );
  },
);

// Data(psmdbClusterDetails).Scenario(
//   'PMM-T503 Verify monitoring of PSMDB nodes and services @dbaas',
//   async ({ dbaasPage, current }) => {
//     const serviceName = `${current.namespace}-${current.clusterName}-${current.nodeType}-${current.node}`;
//     const replSet = current.nodeType;

//     await dbaasPage.psmdbClusterMetricCheck(psmdb_cluster, serviceName, serviceName, replSet);
//     await dbaasPage.dbaasQANCheck(psmdb_cluster, serviceName, serviceName);
//     await dbaasPage.dbClusterAgentStatusCheck(psmdb_cluster, serviceName, 'MONGODB_SERVICE');
//   },
// );

Scenario(
  'PMM-787 Verify Editing MonogDB Cluster is possible, '
    + 'PMM-T781 Verify API keys are deleted when DB cluster is deleted @dbaas',
  async ({
    I, dbaasPage, dbaasAPI, dbaasActionsPage,
  }) => {
    await dbaasAPI.deleteAllDBCluster(clusterName);
    I.amOnPage(dbaasPage.url);
    await dbaasActionsPage.createClusterAdvancedOption(clusterName, psmdb_cluster, 'MongoDB', psmdb_configuration);
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent(psmdb_cluster));
    await dbaasPage.postClusterCreationValidation(psmdb_cluster, clusterName, 'MongoDB');
    await dbaasPage.validateClusterDetail(
      psmdb_cluster,
      clusterName,
      psmdb_configuration,
      psmdb_configuration.clusterDashboardRedirectionLink,
    );
    // I.click(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(psmdb_cluster));
    // await dbaasActionsPage.checkActionPossible('Update', false); skipped because latest mongodb is not recommended version
    // PMM-787
    const psmdb_configuration_after_edit = {
      topology: 'Cluster',
      numberOfNodes: '4',
      resourcePerNode: 'Custom',
      memory: '1 GB',
      cpu: '0.5',
      disk: '5 GB',
      dbType: mongodb_recommended_version,
      clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.psmdbDashboard(psmdb_cluster),
    };

    await dbaasActionsPage.editCluster(psmdb_cluster, clusterName, psmdb_configuration_after_edit);
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 60, dbaasPage.tabs.dbClusterTab.fields.progressBarContent(psmdb_cluster));
    await dbaasPage.postClusterCreationValidation(psmdb_cluster, clusterName, 'MongoDB');
    await dbaasPage.validateClusterDetail(
      psmdb_cluster,
      clusterName,
      psmdb_configuration_after_edit,
      psmdb_configuration_after_edit.clusterDashboardRedirectionLink,
    );

    // PMM-T781
    await dbaasActionsPage.deletePSMDBCluster(psmdb_cluster, clusterName);
    await dbaasPage.apiKeyCheck(clusterName, psmdb_cluster, 'psmdb', false);
  },
).retry(1);

Scenario('PMM-T509 Verify Deleting Mongo Db Cluster in Pending Status is possible @dbaas',
  async ({ I, dbaasPage, dbaasActionsPage }) => {
    const psmdb_cluster_pending_delete = 'psmdb-pending-delete';

    await dbaasAPI.deleteAllDBCluster(clusterName);
    I.amOnPage(dbaasPage.url);
    await dbaasActionsPage.createClusterBasicOptions(clusterName, psmdb_cluster_pending_delete, 'MongoDB');
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent(psmdb_cluster_pending_delete));
    await dbaasActionsPage.deletePSMDBCluster(psmdb_cluster_pending_delete, clusterName);
  }).retry(1);

Scenario('PMM-T704 PMM-T772 PMM-T849 PMM-T850 Resources, PV, Secrets verification @dbaas',
  async ({
    I, dbaasPage, dbaasAPI,
  }) => {
    const psmdb_cluster_resource_check = 'psmdb-resource-1';
    const clusterDetails = {
      topology: 'Cluster',
      numberOfNodes: '1',
      resourcePerNode: 'Custom',
      memory: '2 GB',
      cpu: '0.5',
      disk: '1 GB',
      dbType: 'MongoDB 5.0.7',
      clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.psmdbDashboard(
        psmdb_cluster_resource_check,
      ),
    };

    await dbaasAPI.deleteAllDBCluster(clusterName);
    await dbaasAPI.createCustomPSMDB(clusterName, psmdb_cluster_resource_check, '3');
    await dbaasAPI.waitForDBClusterState(psmdb_cluster_resource_check, clusterName, 'MongoDB', 'DB_CLUSTER_STATE_READY');
    I.amOnPage(dbaasPage.url);
    await dbaasPage.validateClusterDetail(psmdb_cluster_resource_check, clusterName, clusterDetails, 
      clusterDetails.clusterDashboardRedirectionLink);
    const {
      username, password, host, port,
    } = await dbaasAPI.getDbClusterDetails(psmdb_cluster_resource_check, clusterName, 'MongoDB');

    await I.verifyCommand(
      'kubectl run psmdb-client --image=percona/percona-server-mongodb:4.4.5-7 --restart=Never',
    );
    await I.verifyCommand(
      `kubectl get pods ${psmdb_cluster_resource_check}-rs0-0 -o json | grep -i requests -A2 | tail -2`,
      '"cpu": "500m"',
    );
    await I.verifyCommand(
      `kubectl get pods ${psmdb_cluster_resource_check}-rs0-0 -o json | grep -i requests -A2 | tail -2`,
      '"memory": "2G"',
    );
    // await I.verifyCommand(
    //   `kubectl get pv | grep ${psmdb_cluster_resource_check}`,
    //   psmdb_cluster_resource_check,
    // );
    await I.verifyCommand(
      `kubectl get secrets | grep dbaas-${psmdb_cluster_resource_check}-psmdb-secrets`,
      psmdb_cluster_resource_check,
    );
    await I.verifyCommand(
      `kubectl get secrets dbaas-${psmdb_cluster_resource_check}-psmdb-secrets -o yaml | grep MONGODB_USER_ADMIN_PASSWORD: | awk '{print $2}' | base64 --decode`,
      password,
    );
    await dbaasAPI.apiDeleteDBCluster(psmdb_cluster_resource_check, clusterName, psmdb_cluster_type);
    await dbaasAPI.waitForDbClusterDeleted(psmdb_cluster_resource_check, clusterName, 'MongoDB');
    // await I.verifyCommand(
    //   `kubectl get pv | grep ${psmdb_cluster_resource_check}`,
    //   'No resources found',
    //   'fail',
    // );
    // await I.verifyCommand(
    //   `kubectl get secrets | grep dbaas-${psmdb_cluster_resource_check}-psmdb-secrets`,
    //   '',
    //   'fail',
    // );
  });


