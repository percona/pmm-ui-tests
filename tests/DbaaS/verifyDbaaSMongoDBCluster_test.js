const { dbaasAPI, dbaasPage } = inject();
const clusterName = 'Kubernetes_Testing_Cluster_Minikube';
const psmdb_cluster = 'psmdb-cluster';

const psmdb_configuration = {
  topology: 'Cluster',
  numberOfNodes: '1',
  resourcePerNode: 'Custom',
  memory: '2 GB',
  cpu: '1',
  disk: '5 GB',
  dbType: 'MongoDB',
  clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.psmdbDashboard(psmdb_cluster),
};

Feature('DBaaS: MongoDB Cluster Creation, Modifications, Actions, Verification tests');

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

// These test covers a lot of cases, will be refactored and changed in terms of flow, this is initial setup

Scenario('PMM-T642 PMM-T484  PSMDB Cluster with Custom Resources, Verify MongoDB Cluster can be restarted @dbaas',
  async ({
    I, dbaasPage, dbaasAPI, dbaasActionsPage,
  }) => {
    await dbaasAPI.deleteAllDBCluster(clusterName);
    await dbaasPage.waitForDbClusterTab(clusterName);
    I.waitForInvisible(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton, 30);
    await dbaasActionsPage.createClusterAdvancedOption(clusterName, psmdb_cluster, 'MongoDB', psmdb_configuration);
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasPage.postClusterCreationValidation(psmdb_cluster, clusterName, 'MongoDB');
    await dbaasPage.validateClusterDetail(psmdb_cluster, clusterName, psmdb_configuration);
  });

Scenario('PMM-T477 PMM-T461 Verify MongoDB Cluster can be restarted, unregister k8s Cluster when Db Cluster Exist @dbaas',
  async ({ I, dbaasPage, dbaasActionsPage }) => {
    await dbaasPage.waitForKubernetesClusterTab(clusterName);
    dbaasPage.unregisterCluster(clusterName);
    I.waitForText(dbaasPage.failedUnregisterCluster(clusterName, 'PSMDB'));
    await dbaasPage.waitForDbClusterTab(clusterName);
    I.waitForInvisible(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton, 30);
    await dbaasActionsPage.restartCluster(psmdb_cluster, clusterName, 'MongoDB');
    await dbaasPage.validateClusterDetail(psmdb_cluster, clusterName, psmdb_configuration);
    await dbaasActionsPage.deletePSMDBCluster(psmdb_cluster, clusterName);
  });

Scenario('PMM-787 Verify Editing MonogDB Cluster is possible. @dbaas @nightly',
  async ({
    I, dbaasPage, dbaasAPI, dbaasActionsPage,
  }) => {
    await dbaasAPI.deleteAllDBCluster(clusterName);
    await dbaasPage.waitForDbClusterTab(clusterName);
    I.waitForInvisible(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton, 30);
    await dbaasActionsPage.createClusterAdvancedOption(clusterName, psmdb_cluster, 'MongoDB', psmdb_configuration);
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasPage.postClusterCreationValidation(psmdb_cluster, clusterName, 'MongoDB');
    await dbaasPage.validateClusterDetail(psmdb_cluster, clusterName, psmdb_configuration);
    const psmdb_updated_configuration = {
      topology: 'Cluster',
      numberOfNodes: '4',
      resourcePerNode: 'Custom',
      memory: '1 GB',
      cpu: '0.5',
      disk: '5 GB',
      dbType: 'MongoDB',
      clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.psmdbDashboard(psmdb_cluster),
    };

    await dbaasActionsPage.editCluster(psmdb_cluster, clusterName, psmdb_updated_configuration);
    I.click(dbaasPage.tabs.dbClusterTab.updateClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasPage.postClusterCreationValidation(psmdb_cluster, clusterName, 'MongoDB');
    await dbaasPage.validateClusterDetail(psmdb_cluster, clusterName, psmdb_updated_configuration);
    await dbaasActionsPage.deletePSMDBCluster(psmdb_cluster, clusterName);
  });

// Need to Skip due to bug in operator latest version https://jira.percona.com/browse/PMM-8094
xScenario('PMM-T525 PMM-T528 Verify Suspend & Resume for Mongo DB Cluster Works as expected @nightly',
  async ({ I, dbaasPage, dbaasActionsPage }) => {
    const psmdb_cluster_suspend_resume = 'psmdb-suspend-resume';
    const clusterDetails = {
      topology: 'Cluster',
      numberOfNodes: '1',
      resourcePerNode: 'Custom',
      memory: '2 GB',
      cpu: '1',
      disk: '2 GB',
      dbType: 'MongoDB',
      clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.psmdbDashboard(
        psmdb_cluster_suspend_resume,
      ),
    };

    await dbaasAPI.deleteAllDBCluster(clusterName);
    await dbaasPage.waitForDbClusterTab(clusterName);
    I.waitForInvisible(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton, 30);
    await dbaasActionsPage.createClusterAdvancedOption(clusterName, psmdb_cluster_suspend_resume, 'MongoDB', clusterDetails);
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasPage.postClusterCreationValidation(psmdb_cluster_suspend_resume, clusterName, 'MongoDB');
    await dbaasPage.validateClusterDetail(psmdb_cluster_suspend_resume, clusterName, clusterDetails);
    await dbaasActionsPage.suspendCluster(psmdb_cluster_suspend_resume, clusterName, 'MongoDB');
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterStatusPaused, 60);
    I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusPaused);
    await dbaasActionsPage.resumeCluster(psmdb_cluster_suspend_resume, clusterName, 'MongoDB');
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive, 60);
    I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive);
    await dbaasPage.validateClusterDetail(psmdb_cluster_suspend_resume, clusterName, clusterDetails);
    await dbaasActionsPage.deletePSMDBCluster(psmdb_cluster_suspend_resume, clusterName);
  });

// skipping the UI delete due to bug: https://jira.percona.com/browse/PMM-8115 the popup doesn't close until the request return.
xScenario('PMM-T509 Verify Deleting Mongo Db Cluster in Pending Status is possible @dbaas',
  async ({ I, dbaasPage, dbaasActionsPage }) => {
    const psmdb_cluster_pending_delete = 'psmdb-pending-delete';

    await dbaasAPI.deleteAllDBCluster(clusterName);
    await dbaasPage.waitForDbClusterTab(clusterName);
    I.waitForInvisible(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton, 30);
    await dbaasActionsPage.createClusterBasicOptions(clusterName, psmdb_cluster_pending_delete, 'MongoDB');
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);

    // skipping the UI delete due to bug: https://jira.percona.com/browse/PMM-8115 the popup doesn't close until the request return.
    // await dbaasActionsPage.deletePSMDBCluster(psmdb_cluster_pending_delete, clusterName);

    // Using API delete call to check if this is still possible
    await dbaasAPI.apiDeletePSMDBCluster(psmdb_cluster_pending_delete, clusterName);
    await dbaasPage.waitForDbClusterTab(clusterName);
    await dbaasAPI.waitForDbClusterDeleted(psmdb_cluster_pending_delete, clusterName, 'MongoDB');
  });
