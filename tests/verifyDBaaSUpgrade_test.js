const clusterName = 'kube';
const pxc_cluster_name = 'upgrade-pxc';
const psmdb_cluster_name = 'upgrade-psmdb';


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

  Scenario.only('Verify DB clusters after PMM Server upgrade',
  async ({ I, dbaasAPI, homePage }) => {
    await dbaasAPI.apiCreatePXCCluster(pxc_cluster_name, clusterName); //MySQL 8.0.20?
    await dbaasAPI.apiCreatePSMDBCluster(psmdb_cluster_name, clusterName); //MongoDB 4.2.8?
    await dbaasAPI.apiWaitForDBClusterState(pxc_cluster_name, clusterName, 'MySQL', 'DB_CLUSTER_STATE_READY');
    await dbaasAPI.apiWaitForDBClusterState(psmdb_cluster_name, clusterName, 'MongoDB', 'DB_CLUSTER_STATE_READY');
    I.amOnPage(homePage.url);
    await homePage.upgradePMM('2.27.0');

});  
