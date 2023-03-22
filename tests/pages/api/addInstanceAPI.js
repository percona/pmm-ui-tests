const assert = require('assert');

const {
  remoteInstancesHelper,
  inventoryAPI,
} = inject();

const { I } = inject();

module.exports = {
  /**
   * adds remote instance using API /v1/management/...
   *
   * @param   type          {@link remoteInstancesHelper.instanceTypes}
   * @param   serviceName   name of the service to add
   * @param   creds         optional objects with instance accessing details
   * @returns               {Promise<*|void>}
   * @throws                Assertion {Error} if instance was not added
   */
  async apiAddInstance(type, serviceName, creds = {}) {
    switch (type) {
      case remoteInstancesHelper.instanceTypes.mongodb:
        return this.addMongodb(serviceName, creds);
      case remoteInstancesHelper.instanceTypes.mysql:
        return this.addMysql(serviceName, creds);
      case remoteInstancesHelper.instanceTypes.proxysql:
        return this.addProxysql(serviceName);
      case remoteInstancesHelper.instanceTypes.postgresql:
        return this.addPostgresql(serviceName, creds);
      case remoteInstancesHelper.instanceTypes.rds:
        return this.addRDS(serviceName, creds);
      case remoteInstancesHelper.instanceTypes.rdsAurora:
        return this.addRDS(serviceName, creds);
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
    const resp = await I.sendPostRequest('v1/management/MySQL/Add', body, headers);

    I.assertEqual(resp.status, 200, `Instance ${serviceName} was not added for monitoring. ${resp.data.message}`);

    return resp.data;
  },

  async addMysqlSSL(connection) {
    const body = {
      add_node: {
        node_name: connection.serviceName,
        node_type: 'REMOTE_NODE',
      },
      port: connection.port,
      address: connection.address,
      service_name: connection.serviceName,
      username: connection.username,
      password: connection.password,
      tls: true,
      tls_ca: connection.tlsCAFile,
      tls_key: connection.tlsKeyFile,
      tls_cert: connection.tlsCertFile,
      tls_skip_verify: true,
      cluster: connection.cluster,
      pmm_agent_id: 'pmm-server',
      qan_mysql_perfschema: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/MySQL/Add', body, headers);

    I.assertEqual(resp.status, 200, `Instance ${connection.serviceName} was not added for monitoring`);
  },

  async addPostgresql(serviceName, creds = {}) {
    const {
      host, port, username, password,
    } = creds;
    const body = {
      add_node: {
        node_name: serviceName,
        node_type: 'REMOTE_NODE',
      },
      port: port || remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.port,
      address: host || remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.host,
      service_name: serviceName,
      username: username || remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.username,
      password: password || remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.password,
      cluster: remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.clusterName,
      pmm_agent_id: 'pmm-server',
      qan_postgresql_pgstatements_agent: true,
      tls_skip_verify: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/PostgreSQL/Add', body, headers);

    I.assertEqual(resp.status, 200, `Instance ${serviceName} was not added for monitoring`);
  },

  async addPostgreSqlSSL(connection) {
    const body = {
      add_node: {
        node_name: connection.serviceName,
        node_type: 'REMOTE_NODE',
      },
      port: connection.port,
      address: connection.address,
      service_name: connection.serviceName,
      username: connection.username,
      password: connection.password,
      tls: true,
      tls_ca: connection.tlsCAFile,
      tls_key: connection.tlsKeyFile,
      tls_cert: connection.tlsCertFile,
      tls_skip_verify: true,
      cluster: connection.cluster,
      pmm_agent_id: 'pmm-server',
      qan_postgresql_pgstatements_agent: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/PostgreSQL/Add', body, headers);

    I.assertEqual(resp.status, 200, `Instance ${connection.serviceName} was not added for monitoring`);
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

    I.assertEqual(resp.status, 200, `Instance ${serviceName} was not added for monitoring`);
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

    I.assertEqual(resp.status, 200, `Instance ${serviceName} was not added for monitoring`);
  },

  async addMongodb(serviceName, creds = {}) {
    const {
      host, port, username, password,
    } = creds;
    const body = {
      add_node: {
        node_name: serviceName,
        node_type: 'REMOTE_NODE',
      },
      port: port || remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.port,
      address: host || remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.host,
      service_name: serviceName,
      username: username || remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.username,
      password: password || remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.password,
      cluster: remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.clusterName,
      pmm_agent_id: 'pmm-server',
      qan_mongodb_profiler: true,
      tls_skip_verify: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/MongoDB/Add', body, headers);

    I.assertEqual(resp.status, 200, `Instance ${serviceName} was not added for monitoring, \n ${JSON.stringify(resp.data, null, 2)}`);
  },

  async addMongoDBSSL(connection) {
    const body = {
      add_node: {
        node_name: connection.serviceName,
        node_type: 'REMOTE_NODE',
      },
      port: connection.port,
      address: connection.address,
      service_name: connection.serviceName,
      tls: true,
      tls_certificate_file_password: connection.tls_certificate_file_password,
      tls_certificate_key: connection.tls_certificate_key,
      tls_ca: connection.tls_ca,
      tls_skip_verify: true,
      cluster: connection.cluster,
      pmm_agent_id: 'pmm-server',
      qan_mongodb_profiler: true,
      authentication_mechanism: 'MONGODB-X509',
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/MongoDB/Add', body, headers);

    I.assertEqual(resp.status, 200, `Instance ${connection.serviceName} was not added for monitoring`);
  },

  async addRDS(serviceName, connection = {}) {
    const {
      port, username, password, address, cluster, aws_access_key, aws_secret_key,
    } = connection;
    const body = {
      add_node: {
        node_name: serviceName,
        node_type: 'REMOTE_NODE',
      },
      address: address || remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.address,
      aws_access_key: aws_access_key || remoteInstancesHelper.remote_instance.aws.aws_access_key,
      aws_secret_key: aws_secret_key || remoteInstancesHelper.remote_instance.aws.aws_secret_key,
      service_name: serviceName,
      username: username || remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.username,
      password: password || remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.password,
      az: 'us-east-2a',
      cluster: cluster || remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.clusterName,
      engine: 'DISCOVER_RDS_MYSQL',
      instance_id: serviceName,
      isRDS: true,
      pmm_agent_id: 'pmm-server',
      port: port || remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.port,
      qan_mysql_perfschema: true,
      rds_exporter: true,
      region: 'us-east-2',
      replication_set: 'rds_mysql_repl',
      tls_skip_verify: true,
      disable_basic_metrics: false,
      disable_enhanced_metrics: false,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/RDS/Add', body, headers);

    I.assertEqual(resp.status, 200, `Instance ${serviceName} was not added for monitoring`);

    return resp.data;
  },

  async addExternalService(serviceName) {
    const body = {
      add_node: {
        node_name: serviceName,
        node_type: 'REMOTE_NODE',
      },
      address: remoteInstancesHelper.remote_instance.external.redis.host,
      service_name: serviceName,
      schema: remoteInstancesHelper.remote_instance.external.redis.schema,
      cluster: remoteInstancesHelper.remote_instance.external.redis.clusterName,
      listen_port: remoteInstancesHelper.remote_instance.external.redis.port,
      metrics_path: remoteInstancesHelper.remote_instance.external.redis.metricsPath,
      group: remoteInstancesHelper.remote_instance.external.redis.group,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/External/Add', body, headers);

    I.assertEqual(resp.status, 200,
      `External Service ${serviceName} was not added for monitoring got following response ${JSON.stringify(resp.data)}`);
  },

  async addInstanceForSTT(connection, instanceName = 'stt-mysql-5.7.30') {
    await inventoryAPI.deleteNodeByServiceName(remoteInstancesHelper.serviceTypes.mysql.serviceType, instanceName);
    let instance;

    if (process.env.OVF_TEST === 'yes') {
      instance = await this.apiAddInstance(remoteInstancesHelper.instanceTypes.rds, instanceName);
    } else {
      instance = await this.apiAddInstance(remoteInstancesHelper.instanceTypes.mysql, instanceName, connection);
    }

    const nodeId = instance.service.node_id;
    const serviceId = instance.service.service_id;

    return [nodeId, serviceId];
  },
};
