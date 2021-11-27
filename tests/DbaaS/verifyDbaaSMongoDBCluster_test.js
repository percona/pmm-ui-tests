const { dbaasAPI, dbaasPage } = inject();
const clusterName = 'Kubernetes_Testing_Cluster_Minikube';
const psmdb_cluster = 'psmdb-cluster';
const assert = require('assert');

const psmdbClusterDetails = new DataTable(['namespace', 'clusterName', 'node', 'nodeType']);

// only to details in current object for each node check
psmdbClusterDetails.add(['default', `${psmdb_cluster}`, '0', 'rs0']);
psmdbClusterDetails.add(['default', `${psmdb_cluster}`, '1', 'rs0']);
psmdbClusterDetails.add(['default', `${psmdb_cluster}`, '2', 'rs0']);
psmdbClusterDetails.add(['default', `${psmdb_cluster}`, '0', 'cfg']);
psmdbClusterDetails.add(['default', `${psmdb_cluster}`, '1', 'cfg']);
psmdbClusterDetails.add(['default', `${psmdb_cluster}`, '2', 'cfg']);

const psmdb_configuration = {
  topology: 'Cluster',
  numberOfNodes: '1',
  resourcePerNode: 'Custom',
  memory: '2 GB',
  cpu: '1',
  disk: '5 GB',
  dbType: 'MongoDB 4.4.6',
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

Scenario(
  'PMM-T665 PMM-T642 PMM-T484  PSMDB Cluster with Custom Resources, Verify MongoDB Cluster can be restarted, log popup @dbaas',
  async ({
    I, dbaasPage, dbaasAPI, dbaasActionsPage,
  }) => {
    const collectionNames = '[ "customers", "system.profile" ]';
    const dbName = 'tutorialkart2';

    await dbaasAPI.deleteAllDBCluster(clusterName);
    await dbaasPage.waitForDbClusterTab(clusterName);
    I.waitForInvisible(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton, 30);
    await dbaasActionsPage.createClusterAdvancedOption(clusterName, psmdb_cluster, 'MongoDB', psmdb_configuration);
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasPage.postClusterCreationValidation(psmdb_cluster, clusterName, 'MongoDB');
    await dbaasPage.verifyLogPopup(33);
    await dbaasPage.validateClusterDetail(psmdb_cluster, clusterName, psmdb_configuration);
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
  },
);

Data(psmdbClusterDetails).Scenario(
  'PMM-T503, Verify monitoring of PSMDB cluster @dbaas',
  async ({
    I, dbaasPage, current,
  }) => {
    await dbaasPage.waitForDbClusterTab(clusterName);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 30);
    const serviceName = `${current.namespace}-${current.clusterName}-${current.nodeType}-${current.node}`;

    await dbaasPage.psmdbClusterMetricCheck(psmdb_cluster, serviceName, serviceName);
    await dbaasPage.dbaasQANCheck(psmdb_cluster, serviceName, serviceName);
    await dbaasPage.dbClusterAgentStatusCheck(psmdb_cluster, serviceName, 'MONGODB_SERVICE');
  },
);

Scenario(
  'PMM-T477 PMM-T461 Verify MongoDB Cluster can be restarted, unregister k8s Cluster when Db Cluster Exist @dbaas',
  async ({ I, dbaasPage, dbaasActionsPage }) => {
    await dbaasPage.waitForKubernetesClusterTab(clusterName);
    dbaasPage.unregisterCluster(clusterName);
    I.waitForText(dbaasPage.failedUnregisterCluster(clusterName, 'PSMDB'));
    await dbaasPage.waitForDbClusterTab(clusterName);
    I.waitForInvisible(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton, 30);
    await dbaasActionsPage.restartCluster(psmdb_cluster, clusterName, 'MongoDB');
    await dbaasPage.validateClusterDetail(psmdb_cluster, clusterName, psmdb_configuration);
    await dbaasActionsPage.deletePSMDBCluster(psmdb_cluster, clusterName);
  },
);

Scenario(
  'PMM-787 Verify Editing MonogDB Cluster is possible. @dbaas',
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
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu);
    await dbaasActionsPage.checkActionPossible('Update', false);
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu);
    const psmdb_updated_configuration = {
      topology: 'Cluster',
      numberOfNodes: '4',
      resourcePerNode: 'Custom',
      memory: '1 GB',
      cpu: '0.5',
      disk: '5 GB',
      dbType: 'MongoDB 4.4.6',
      clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.psmdbDashboard(psmdb_cluster),
    };

    await dbaasActionsPage.editCluster(psmdb_cluster, clusterName, psmdb_updated_configuration);
    I.click(dbaasPage.tabs.dbClusterTab.updateClusterButton);
    I.waitForText('Processing', 60, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasPage.postClusterCreationValidation(psmdb_cluster, clusterName, 'MongoDB');
    await dbaasPage.validateClusterDetail(psmdb_cluster, clusterName, psmdb_updated_configuration);
    await dbaasActionsPage.deletePSMDBCluster(psmdb_cluster, clusterName);
  },
).retry(1);

// Need to Skip due to bug in operator latest version https://jira.percona.com/browse/PMM-8094
xScenario(
  'PMM-T525 PMM-T528 Verify Suspend & Resume for Mongo DB Cluster Works as expected @dbaas',
  async ({ I, dbaasPage, dbaasActionsPage }) => {
    const psmdb_cluster_suspend_resume = 'psmdb-suspend-resume';
    const clusterDetails = {
      topology: 'Cluster',
      numberOfNodes: '1',
      resourcePerNode: 'Custom',
      memory: '2 GB',
      cpu: '1',
      disk: '2 GB',
      dbType: 'MongoDB 4.4.6',
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
  },
);

// skipping the UI delete due to bug: https://jira.percona.com/browse/PMM-8115 the popup doesn't close until the request return.
xScenario(
  'PMM-T509 Verify Deleting Mongo Db Cluster in Pending Status is possible @dbaas',
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
  },
).retry(1);

Scenario(
  'PMM-T704 PMM-T772 PMM-T849 PMM-T850 Resources, PV, Secrets verification @dbaas',
  async ({
    I, dbaasPage, dbaasAPI, dbaasActionsPage, adminPage,
  }) => {
    const psmdb_cluster_resource_check = 'psmdb-resource-1';
    const clusterDetails = {
      topology: 'Cluster',
      numberOfNodes: '1',
      resourcePerNode: 'Custom',
      memory: '1 GB',
      cpu: '1',
      disk: '2 GB',
      dbType: 'MongoDB 4.4.6',
      clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.psmdbDashboard(
        psmdb_cluster_resource_check,
      ),
    };

    await dbaasAPI.deleteAllDBCluster(clusterName);
    await dbaasPage.waitForDbClusterTab(clusterName);
    I.waitForInvisible(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton, 30);
    await dbaasActionsPage.createClusterAdvancedOption(clusterName, psmdb_cluster_resource_check, 'MongoDB', clusterDetails);
    I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasPage.postClusterCreationValidation(psmdb_cluster_resource_check, clusterName, 'MongoDB');
    await dbaasPage.validateClusterDetail(psmdb_cluster_resource_check, clusterName, clusterDetails);
    const {
      username, password, host, port,
    } = await dbaasAPI.getDbClusterDetails(psmdb_cluster_resource_check, clusterName, 'MongoDB');

    await I.verifyCommand(
      'kubectl run psmdb-client --image=percona/percona-server-mongodb:4.4.5-7 --restart=Never',
    );
    await I.verifyCommand(
      `kubectl get pods ${psmdb_cluster_resource_check}-rs0-0 -o json | grep -i requests -A2 | tail -2`,
      '"cpu": "1"',
    );
    await I.verifyCommand(
      `kubectl get pods ${psmdb_cluster_resource_check}-rs0-0 -o json | grep -i requests -A2 | tail -2`,
      '"memory": "1G"',
    );
    await I.verifyCommand(
      `kubectl get pv | grep ${psmdb_cluster_resource_check}`,
      psmdb_cluster_resource_check,
    );
    await I.verifyCommand(
      `kubectl get secrets | grep dbaas-${psmdb_cluster_resource_check}-psmdb-secrets`,
      psmdb_cluster_resource_check,
    );
    await I.verifyCommand(
      `kubectl get secrets dbaas-${psmdb_cluster_resource_check}-psmdb-secrets -o yaml | grep MONGODB_USER_ADMIN_PASSWORD: | awk '{print $2}' | base64 --decode`,
      password,
    );
    await dbaasAPI.apiDeletePSMDBCluster(psmdb_cluster_resource_check, clusterName);
    await dbaasAPI.waitForDbClusterDeleted(psmdb_cluster_resource_check, clusterName, 'MongoDB');
    await I.verifyCommand(
      `kubectl get pv | grep ${psmdb_cluster_resource_check}`,
      'No resources found',
      'fail',
    );
    await I.verifyCommand(
      `kubectl get secrets | grep dbaas-${psmdb_cluster_resource_check}-psmdb-secrets`,
      '',
      'fail',
    );
  },
).retry(1);

Scenario('Verify update PSMDB Cluster version @dbaas', async ({ I, dbaasPage, dbaasActionsPage }) => {
  const psmdb_cluster_update = 'psmdb-update';
  const clusterDetails = {
    topology: 'Cluster',
    numberOfNodes: '1',
    resourcePerNode: 'Custom',
    memory: '2 GB',
    cpu: '1',
    disk: '2 GB',
    dbType: 'MongoDB',
    clusterDashboardRedirectionLink: dbaasPage.clusterDashboardUrls.psmdbDashboard(
      psmdb_cluster_update,
    ),
  };

  await dbaasAPI.deleteAllDBCluster(clusterName);
  await dbaasPage.waitForDbClusterTab(clusterName);
  I.waitForInvisible(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton, 30);
  await dbaasActionsPage.createClusterAdvancedOption(clusterName, psmdb_cluster_update, 'MongoDB', clusterDetails, '4.2.8-8');
  I.click(dbaasPage.tabs.dbClusterTab.createClusterButton);
  I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
  await dbaasPage.postClusterCreationValidation(psmdb_cluster_update, clusterName);
  await dbaasActionsPage.updateCluster();
  I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterStatusUpdating, 60);
  I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusUpdating);
  await dbaasAPI.waitForPSMDBClusterReady(psmdb_cluster_update, clusterName);
  I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive, 120);
  I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive);
  await dbaasActionsPage.deletePSMDBCluster(psmdb_cluster_update, clusterName);
});
