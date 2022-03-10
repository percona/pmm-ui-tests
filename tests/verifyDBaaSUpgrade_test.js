const clusterName = 'kube';
const pxc_cluster_name = 'upgrade-pxc';
const psmdb_cluster_name = 'upgrade-psmdb';
const active_state = 'ACTIVE';

Feature('Updates of DB clusters and operators and PMM Server upgrade related tests');

// BeforeSuite(async ({ dbaasAPI, settingsAPI }) => {
//     await settingsAPI.changeSettings({ publicAddress: process.env.VM_IP });
//     if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
//       await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
//     }
//   });
  
//   AfterSuite(async ({ dbaasAPI }) => {
//     await dbaasAPI.apiUnregisterCluster(clusterName, true);
//   });
  
  Before(async ({ I, dbaasAPI }) => {
    await I.Authorize();
    // if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
    //   await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    // }
  });

  Scenario('Verify DB clusters after PMM Server upgrade',
  async ({ I, dbaasAPI, homePage, dbaasPage, dbaasActionsPage }) => {
    // await dbaasAPI.apiCreatePXCCluster(pxc_cluster_name, clusterName); //MySQL 8.0.20?
    // await dbaasAPI.apiCreatePSMDBCluster(psmdb_cluster_name, clusterName); //MongoDB 4.2.8?
    // await dbaasAPI.apiWaitForDBClusterState(pxc_cluster_name, clusterName, 'MySQL', 'DB_CLUSTER_STATE_READY');
    // await dbaasAPI.apiWaitForDBClusterState(psmdb_cluster_name, clusterName, 'MongoDB', 'DB_CLUSTER_STATE_READY');

    I.amOnPage(homePage.url);
    await homePage.upgradePMM('2.27.0');
    I.amOnPage('graph/dbaas/dbclusters');
    I.waitForText(active_state, 10, dbaasPage.tabs.dbClusterTab.fields.clusterTableRow(pxc_cluster_name));
    I.waitForText(active_state, 10, dbaasPage.tabs.dbClusterTab.fields.clusterTableRow(psmdb_cluster_name));

    //check paramaters after upgrade

    //pause
    await dbaasActionsPage.suspendCluster(psmdb_cluster_name, clusterName, 'MongoDB');
    await dbaasActionsPage.suspendCluster(pxc_cluster_name, clusterName);

    //restart
    //edit
    //logs

    // TODO: update all occurrences of clusterActionsMenu with parameter
}); 

const pxcDBClusterDetails = new DataTable(['namespace', 'clusterName', 'node']);
pxcDBClusterDetails.add(['default', `${pxc_cluster_name}`, '0']);

Data(pxcDBClusterDetails).Scenario('PMM-T726 Verify PXC cluster monitoring after PMM Server upgrade',
async ({ I, dbaasAPI, homePage, dbaasPage, pmmInventoryPage, current }) => {

  const serviceName = `${current.namespace}-${current.clusterName}-pxc-${current.node}`;
  const haproxyNodeName = `${current.namespace}-${current.clusterName}-haproxy-${current.node}`;

  await dbaasPage.dbClusterAgentStatusCheck(pxc_cluster_name, serviceName, 'MYSQL_SERVICE');
  await dbaasPage.dbaasQANCheck(pxc_cluster_name, serviceName, serviceName);
  await dbaasPage.pxcClusterMetricCheck(pxc_cluster_name, serviceName, serviceName, haproxyNodeName);
}); 

const psmdbClusterDetails = new DataTable(['namespace', 'clusterName', 'node', 'nodeType']);
psmdbClusterDetails.add(['default', `${psmdb_cluster_name}`, '0', 'rs0']);
psmdbClusterDetails.add(['default', `${psmdb_cluster_name}`, '1', 'rs0']);
psmdbClusterDetails.add(['default', `${psmdb_cluster_name}`, '2', 'rs0']);
psmdbClusterDetails.add(['default', `${psmdb_cluster_name}`, '0', 'cfg']);
psmdbClusterDetails.add(['default', `${psmdb_cluster_name}`, '1', 'cfg']);
psmdbClusterDetails.add(['default', `${psmdb_cluster_name}`, '2', 'cfg']);

Data(psmdbClusterDetails).Scenario('PMM-T726 Verify PSMDB cluster monitoring after PMM Server upgrade',
async ({ I, dbaasAPI, homePage, dbaasPage, pmmInventoryPage, current }) => {
  const serviceName = `${current.namespace}-${current.clusterName}-${current.nodeType}-${current.node}`;

  await dbaasPage.dbClusterAgentStatusCheck(psmdb_cluster_name, serviceName, 'MONGODB_SERVICE');
  await dbaasPage.dbaasQANCheck(psmdb_cluster_name, serviceName, serviceName);
  await dbaasPage.psmdbClusterMetricCheck(psmdb_cluster_name, serviceName, serviceName);
}); 


//delete existing
//create new 
