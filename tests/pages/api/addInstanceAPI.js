const assert = require('assert');

const {
  remoteInstancesHelper,
} = inject();

const { I } = inject();

module.exports = {
  async apiAddInstance(type, serviceName, creds) {
    switch (type) {
      case remoteInstancesHelper.instanceTypes.mongodb:
        return this.addMongodb(serviceName);
      case remoteInstancesHelper.instanceTypes.mysql:
        return this.addMysql(serviceName, creds);
      case remoteInstancesHelper.instanceTypes.proxysql:
        return this.addProxysql(serviceName);
      case remoteInstancesHelper.instanceTypes.postgresql:
        return this.addPostgresql(serviceName);
      case remoteInstancesHelper.instanceTypes.rds:
        return this.addRDS(serviceName);
      case remoteInstancesHelper.instanceTypes.postgresGC:
        return await this.addPostgreSQLGC(serviceName);
      default:
        throw new Error('Unknown instance type');
    }
  },

  async addMysql(serviceName, connection = {}) {
    const {
      host, port, username, password,
    } = connection;
    const body = {
      add_node: {
        node_name: serviceName,
        node_type: 'REMOTE_NODE',
      },
      port: port || remoteInstancesHelper.remote_instance.mysql.ps_5_7.port,
      qan_mysql_perfschema: true,
      address: host || remoteInstancesHelper.remote_instance.mysql.ps_5_7.host,
      service_name: serviceName,
      username: username || remoteInstancesHelper.remote_instance.mysql.ps_5_7.username,
      password: password || remoteInstancesHelper.remote_instance.mysql.ps_5_7.password,
      cluster: remoteInstancesHelper.remote_instance.mysql.ps_5_7.clusterName,
      engine: 'DISCOVER_RDS_MYSQL',
      pmm_agent_id: 'pmm-server',
    };

    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('/v1/management/MySQL/Add', body, headers);

    assert.equal(resp.status, 200, `Instance ${serviceName} was not added for monitoring. ${resp.data.message}`);

    return resp.data;
  },

  async addPostgresql(serviceName) {
    const body = {
      add_node: {
        node_name: serviceName,
        node_type: 'REMOTE_NODE',
      },
      port: 5432,
      address: remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.host,
      service_name: serviceName,
      username: remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.username,
      password: remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.password,
      cluster: remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.clusterName,
      pmm_agent_id: 'pmm-server',
      qan_postgresql_pgstatements_agent: true,
      tls_skip_verify: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/PostgreSQL/Add', body, headers);

    assert.equal(resp.status, 200, `Instance ${serviceName} was not added for monitoring`);
  },

  async addPostgreSQLGC(serviceName) {
    const body = {
      add_node: {
        node_name: serviceName,
        node_type: 'REMOTE_NODE',
      },
      port: 5432,
      address: remoteInstancesHelper.remote_instance.gc.gc_postgresql.address,
      service_name: serviceName,
      username: remoteInstancesHelper.remote_instance.gc.gc_postgresql.userName,
      password: remoteInstancesHelper.remote_instance.gc.gc_postgresql.password,
      cluster: 'postgresql_clust',
      pmm_agent_id: 'pmm-server',
      qan_postgresql_pgstatements_agent: true,
      tls_skip_verify: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/PostgreSQL/Add', body, headers);

    assert.equal(resp.status, 200, `Instance ${serviceName} was not added for monitoring`);
  },

  async addProxysql(serviceName) {
    const body = {
      add_node: {
        node_name: serviceName,
        node_type: 'REMOTE_NODE',
      },
      port: remoteInstancesHelper.remote_instance.proxysql.proxysql_2_1_1.port,
      address: remoteInstancesHelper.remote_instance.proxysql.proxysql_2_1_1.host,
      service_name: serviceName,
      username: remoteInstancesHelper.remote_instance.proxysql.proxysql_2_1_1.username,
      password: remoteInstancesHelper.remote_instance.proxysql.proxysql_2_1_1.password,
      cluster: remoteInstancesHelper.remote_instance.proxysql.proxysql_2_1_1.clusterName,
      pmm_agent_id: 'pmm-server',
      tls_skip_verify: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/ProxySQL/Add', body, headers);

    assert.equal(resp.status, 200, `Instance ${serviceName} was not added for monitoring`);
  },

  async addMongodb(serviceName) {
    const body = {
      add_node: {
        node_name: serviceName,
        node_type: 'REMOTE_NODE',
      },
      port: 27017,
      address: remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.host,
      service_name: serviceName,
      username: remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.username,
      password: remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.password,
      cluster: remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.clusterName,
      pmm_agent_id: 'pmm-server',
      qan_mongodb_profiler: true,
      tls_skip_verify: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/MongoDB/Add', body, headers);

    assert.equal(resp.status, 200, `Instance ${serviceName} was not added for monitoring`);
  },

  async addRDS(serviceName) {
    const body = {
      add_node: {
        node_name: serviceName,
        node_type: 'REMOTE_NODE',
      },
      address: remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.address,
      aws_access_key: remoteInstancesHelper.remote_instance.aws.aws_access_key,
      aws_secret_key: remoteInstancesHelper.remote_instance.aws.aws_secret_key,
      service_name: serviceName,
      username: remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.username,
      password: remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.password,
      az: 'us-east-1c',
      cluster: remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.clusterName,
      engine: 'DISCOVER_RDS_MYSQL',
      instance_id: 'rds-mysql57',
      isRDS: true,
      pmm_agent_id: 'pmm-server',
      port: remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.port,
      qan_mysql_perfschema: true,
      rds_exporter: true,
      region: 'us-east-1',
      replication_set: 'rds_mysql_repl',
      tls_skip_verify: true,
      disable_basic_metrics: true,
      disable_enhanced_metrics: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/RDS/Add', body, headers);

    assert.equal(resp.status, 200, `Instance ${serviceName} was not added for monitoring`);

    return resp.data;
  },

  async addInstanceForSTT(connection) {
    let nodeId;

    if (process.env.OVF_TEST === 'yes') {
      nodeId = (await this.apiAddInstance(remoteInstancesHelper.instanceTypes.rds, 'rds-for-stt-all-checks')).node.node_id;
    } else {
      nodeId = (await this.apiAddInstance(remoteInstancesHelper.instanceTypes.mysql, 'stt-all-checks-mysql-5.7.30', connection)).service.node_id;
    }

    return nodeId;
  },
};
