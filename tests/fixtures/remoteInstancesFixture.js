const {SERVICE_TYPE} = require("../helper/constants");

class RemoteInstancesFixture {
  constructor() {
    this.services = {
      ps_8_4: {
        name: 'ps_8_4',
        type: 'MySQL',
        host: 'ps_pmm_8.4_1',
        port: '3306',
        server_port: '3306',
        username: 'root',
        password: 'GRgrO9301RuF',
        clusterName: 'mysql_clstr',
        service_upgrade_name: 'mysql_upgrade_service',
        service_type: SERVICE_TYPE.MYSQL,
        upgrade_metric_name: 'mysql_global_status_max_used_connections',
        qanFilter: 'mysql',
      },
      psmdb_7: {
        name: 'psmdb_7',
        type: 'MongoDB',
        host: 'rs101',
        port: '27017',
        username: 'pbm',
        password: 'pbmpass',
        clusterName: 'mongo_clstr',
        service_upgrade_name: 'psmdb_upgrade_scervice',
        service_type: SERVICE_TYPE.MONGODB,
        upgrade_metric_name: 'mongodb_connections',
        qanFilter: 'mongodb',
      },
      pdpgsql_17: {
        name: 'pdpgsql_17',
        type: 'PostgreSQL',
        host: 'pdpgsql_pgsm_pmm_17',
        server_port: '5432',
        host_server_port: '5432',
        username: 'pmm',
        password: 'pmm',
        clusterName: 'pgsql_clstr',
        service_upgrade_name: 'postgres_upgrade_service',
        service_type: SERVICE_TYPE.POSTGRESQL,
        upgrade_metric_name: 'pg_stat_database_xact_rollback',
        qanFilter: 'postgresql',
      },
      /* proxysql_2_6_2: {
        name: 'proxysql_2_6_2',
        host: 'pxc_proxysql_pmm_8.0',
        type: 'ProxySQL',
        port: '6033',
        username: 'proxysql_user',
        password: 'passw0rd',
        environment: 'proxy_env',
        clusterName: 'proxy_clstr',
        service_upgrade_name: 'proxysql_upgrade_service',
        service_type: SERVICE_TYPE.PROXYSQL,
        upgrade_metric_name: 'proxysql_stats_memory_auth_memory',
        qanFilter: 'proxysql',
      }, */
      aws_rds_8_4: {
        name: 'aws_rds_8_4',
        type: 'RDS',
        address: process.env.PMM_QA_MYSQL_RDS_8_4_HOST,
        username: process.env.PMM_QA_MYSQL_RDS_8_4_USER,
        password: process.env.PMM_QA_MYSQL_RDS_8_4_PASSWORD,
        clusterName: 'aws_rds_mysql_8_4',
        port: 42001,
        service_upgrade_name: 'mysql_rds_uprgade_service',
        service_type: SERVICE_TYPE.MYSQL,
        upgrade_metric_name: 'mysql_global_status_max_used_connections',
        qanFilter: 'rds',
      },
      mysql_aurora_3: {
        name: 'mysql_aurora_3',
        type: 'RDSAurora',
        address: process.env.PMM_QA_AURORA3_MYSQL_HOST,
        password: process.env.PMM_QA_AURORA3_MYSQL_PASSWORD,
        instance_id: 'pmm-qa-aurora3-mysql-instance-1',
        cluster_name: 'mysqlaws_aurora3',
        service_upgrade_name: 'aurora_rds_upgrade_service',
        service_type: SERVICE_TYPE.MYSQL,
        upgrade_metric_name: 'mysql_global_status_max_used_connections',
        qanFilter: 'aurora_rds',
      },
    };
  }

  getUpgradeRemoteServiceByName(remoteInstanceName) {
    return Object.values(this.services).find((obj) => obj.name === remoteInstanceName);
  }

  getUpgradeRemoteServicesName() {
    return Object.values(this.services).map((obj) => obj.name);
  }

  getConnectionDetails(remoteInstance) {
    // return
  }
}

module.exports = new RemoteInstancesFixture();
module.exports.RemoteInstancesFixture = RemoteInstancesFixture;
