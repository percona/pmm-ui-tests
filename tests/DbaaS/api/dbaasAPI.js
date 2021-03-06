const assert = require('assert');

const { I } = inject();
const psmdb_cluster_type = 'DB_CLUSTER_TYPE_PSMDB';
const pxc_cluster_type = 'DB_CLUSTER_TYPE_PXC';

module.exports = {

  async apiRegisterCluster(clusterConfiguration, clusterName) {
    const body = {
      kubernetes_cluster_name: clusterName,
      kube_auth: { kubeconfig: clusterConfiguration },
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const response = await I.sendPostRequest('v1/management/DBaaS/Kubernetes/Register', body, headers);

    assert.ok(
      response.status === 200,
      `Failed to register cluster with name "${clusterName}". Response message is "${response.data.message}"`,
    );
  },

  async apiUnregisterCluster(clusterName, forceBoolean = false) {
    const body = { kubernetes_cluster_name: clusterName, force: forceBoolean };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const response = await I.sendPostRequest('v1/management/DBaaS/Kubernetes/Unregister', body, headers);

    assert.ok(
      response.status === 200,
      `Failed to unregister cluster with name "${clusterName}". Response message is "${response.data.message}"`,
    );
  },

  async apiUnregisterAllCluster() {
    const body = {};
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const response = await I.sendPostRequest('v1/management/DBaaS/Kubernetes/List', body, headers);

    if (response.data.kubernetes_clusters) {
      for (const cluster of response.data.kubernetes_clusters) {
        await this.apiUnregisterCluster(cluster.kubernetes_cluster_name, true);
      }
    }
  },

  async apiDeleteDBCluster(dbClusterName, clusterName, dbClusterType) {
    const body = { kubernetes_cluster_name: clusterName, name: dbClusterName, cluster_type: dbClusterType };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    let response = await I.sendPostRequest('v1/management/DBaaS/DBClusters/List', body, headers);  
    
    if (response.data.pxc_clusters) {
      const pxc_cluster = response.data.pxc_clusters.find(
        (o) => o.name === dbClusterName,
      );

      if (pxc_cluster.state !== 'DB_CLUSTER_STATE_DELETING') {
        response = await I.sendPostRequest('v1/management/DBaaS/DBClusters/Delete', body, headers);

        assert.ok(
          response.status === 200,
          `Failed to delete "${dbClusterType}" cluster with name "${dbClusterName}". Response message is "${response.data.message}"`,
        );
      }
    }

    if (response.data.psmdb_clusters) {
      const psmdb_cluster = response.data.psmdb_clusters.find(
        (o) => o.name === dbClusterName,
      );
      if (psmdb_cluster) {
        response = await I.sendPostRequest('v1/management/DBaaS/DBClusters/Delete', body, headers);

        assert.ok(
          response.status === 200,
          `Failed to delete "${dbClusterType}" cluster with name "${dbClusterName}". Response message is "${response.data.message}"`,
        );
      }
    }
  },

  async apiCheckRegisteredClusterExist(clusterName) {
    const body = {};
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const response = await I.sendPostRequest('v1/management/DBaaS/Kubernetes/List', body, headers);

    if (response.data.kubernetes_clusters) {
      const cluster = response.data.kubernetes_clusters.find(
        (o) => o.kubernetes_cluster_name === clusterName,
      );

      return cluster !== undefined;
    }

    return false;
  },

  async apiCheckDbClusterExist(dbClusterName, k8sClusterName, dbType = 'MySQL') {
    const body = {
      kubernetesClusterName: k8sClusterName,
      operators: { xtradb: { status: 'OPERATORS_STATUS_OK' }, psmdb: { status: 'OPERATORS_STATUS_OK' } },
      status: 'KUBERNETES_CLUSTER_STATUS_OK',
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    
    const response = await I.sendPostRequest('v1/management/DBaaS/DBClusters/List', body, headers);

    if (response.data.pxc_clusters) {
      const cluster = response.data.pxc_clusters.find(
        (o) => o.name === dbClusterName,
      );

      return !!cluster;
    }

    if (response.data.psmdb_clusters) {
      const cluster = response.data.psmdb_clusters.find(
        (o) => o.name === dbClusterName,
      );

      return !!cluster;
    }

    return false;
  },

  async waitForDBClusterState(dbClusterName, clusterName, dbType = 'MySQL', dbState) {
    const body = {
      kubernetesClusterName: clusterName,
      operators: { xtradb: { status: 'OPERATORS_STATUS_OK' }, psmdb: { status: 'OPERATORS_STATUS_OK' } },
      status: 'KUBERNETES_CLUSTER_STATUS_OK',
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    for (let i = 0; i < 30; i++) {
      let response = await I.sendPostRequest('v1/management/DBaaS/DBClusters/List', body, headers);

      if (dbType === 'MySQL') {
        const pxc_cluster = response.data.pxc_clusters.find(
          (o) => o.name === dbClusterName,
        );
        
        if (pxc_cluster && pxc_cluster.state === dbState) {
          break;
        }
      } else {
        const psmdb_cluster = response.data.psmdb_clusters.find(
          (o) => o.name === dbClusterName,
        );

        if (psmdb_cluster && psmdb_cluster.state === dbState) {
          break;
        }
      }

      await new Promise((r) => setTimeout(r, 10000));
    }
  },

  async waitForDbClusterDeleted(dbClusterName, clusterName, dbType = 'MySQL') {
    const body = {
      kubernetesClusterName: clusterName,
      operators: { xtradb: { status: 'OPERATORS_STATUS_OK' }, psmdb: { status: 'OPERATORS_STATUS_OK' } },
      status: 'KUBERNETES_CLUSTER_STATUS_OK',
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    for (let i = 0; i < 30; i++) {
      let response = await I.sendPostRequest('v1/management/DBaaS/DBClusters/List', body, headers);

      if (response.data.pxc_clusters || response.data.psmdb_clusters) {
        if (dbType === 'MySQL') {
          const pxc_cluster = response.data.pxc_clusters.find(
            (o) => o.name === dbClusterName,
          );
          
          if (pxc_cluster === undefined) {
            break;
          }          
        } else {
          const psmdb_cluster = response.data.psmdb_clusters.find(
            (o) => o.name === dbClusterName,
          );  

          if (psmdb_cluster === undefined) {
            break;
          }     
        }
      } else break;

      await new Promise((r) => setTimeout(r, 10000));
    }
  },

  async getDbClusterDetails(dbClusterName, clusterName, dbType = 'MySQL') {
    let response;
    const body = {
      kubernetesClusterName: clusterName,
      name: dbClusterName,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    if (dbType === 'MySQL') {
      response = await I.sendPostRequest('v1/management/DBaaS/PXCClusters/GetCredentials', body, headers);
    } else {
      response = await I.sendPostRequest('v1/management/DBaaS/PSMDBClusters/GetCredentials', body, headers);
    }

    return response.data.connection_credentials;
  },

  async deleteAllDBCluster(clusterName) {
    const body = {
      kubernetesClusterName: clusterName,
      operators: { xtradb: { status: 'OPERATORS_STATUS_OK' }, psmdb: { status: 'OPERATORS_STATUS_OK' } },
      status: 'KUBERNETES_CLUSTER_STATUS_OK',
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const response = await I.sendPostRequest('v1/management/DBaaS/DBClusters/List', body, headers);

    if (response.data.pxc_clusters) {
      for (const db of response.data.pxc_clusters) {
        await this.apiDeleteDBCluster(db.name, clusterName, pxc_cluster_type);
        await this.waitForDbClusterDeleted(db.name, clusterName);
      }
    }

    if (response.data.psmdb_clusters) {
      for (const db of response.data.psmdb_clusters) {
        await this.apiDeleteDBCluster(db.name, clusterName, psmdb_cluster_type);
        await this.waitForDbClusterDeleted(db.name, clusterName, 'MongoDB');
      }
    }
  },

  async apiCreatePXCCluster(dbClusterName, clusterName) {
    const body = { kubernetes_cluster_name: clusterName, name: dbClusterName, params: {cluster_size: 1, 
      pxc: {compute_resources: {cpu_m: 1000, memory_bytes: 2000000000}, disk_size: 1000000000}, 
      haproxy: {compute_resources: {cpu_m: 1000, memory_bytes: 2000000000}}} } ;
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    await I.sendPostRequest('v1/management/DBaaS/PXCCluster/Create', body, headers);  
  },

  async apiCreatePSMDBCluster(dbClusterName, clusterName) {
    const body = { kubernetes_cluster_name: clusterName, name: dbClusterName, params: {cluster_size: 3, 
      replicaset: {compute_resources: {cpu_m: 500, memory_bytes: 2000000000}, disk_size: 1000000000}} };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    await I.sendPostRequest('v1/management/DBaaS/PSMDBCluster/Create', body, headers);  
  },
};
