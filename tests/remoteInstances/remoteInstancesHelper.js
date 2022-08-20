const remoteInstanceStatus = {
  mysql: {
    ps_5_7: {
      enabled: true,
    },
    ps_8_0: {
      enabled: true,
    },
    ms_8_0_ssl: {
      enabled: false,
    },
  },
  mongodb: {
    psmdb_4_2: {
      enabled: true,
    },
    psmdb_4_4: {
      enabled: true,
    },
    mongodb_4_4_ssl: {
      enabled: false,
    },
  },
  postgresql: {
    pdpgsql_13_3: {
      enabled: true,
    },
    postgres_13_3_ssl: {
      enabled: false,
    },
  },
  proxysql: {
    proxysql_2_1_1: {
      enabled: process.env.OVF_TEST !== 'yes',
    },
  },
  haproxy: {
    haproxy_2: {
      enabled: true,
    },
  },
  external: {
    redis: {
      enabled: true,
    },
  },
  aws: {
    aws_rds_5_7: {
      enabled: true,
    },
    aws_rds_8_0: {
      enabled: true,
    },
    aws_rds_5_6: {
      enabled: true,
    },
    aws_postgresql_12: {
      enabled: true,
    },
  },
  azure: {
    azure_mysql: {
      enabled: true,
    },
    azure_postgresql: {
      enabled: true,
    },
  },
  // Skipped because of random failures
  gc: {
    gc_postgresql: {
      enabled: false,
      // enabled: process.env.OVF_TEST !== 'yes',
    },
    gc_mysql57: {
      enabled: true,
    },
    gc_mysql80: {
      enabled: true,
    },
    gc_pgsql_13: {
      enabled: true,
    },
  },
  aurora: {
    aurora2: {
      enabled: true,
    },
  },
};

let SERVER_HOST; let EXTERNAL_EXPORTER_HOST; let DB_CONFIG = {};
let PMM_SERVER_OVF_AMI_SETUP = 'false';

DB_CONFIG = {
  MYSQL_SERVER_PORT: '3306',
  POSTGRES_SERVER_PORT: '5432',
  MONGODB_SERVER_PORT: '27017',
  PROXYSQL_SERVER_PORT: '6032',
};

if (process.env.AMI_UPGRADE_TESTING_INSTANCE === 'true' || process.env.OVF_UPGRADE_TESTING_INSTANCE === 'true') {
  PMM_SERVER_OVF_AMI_SETUP = 'true';
  SERVER_HOST = process.env.VM_CLIENT_IP;
  EXTERNAL_EXPORTER_HOST = process.env.VM_CLIENT_IP;
  DB_CONFIG.MYSQL_SERVER_PORT = '42300';
  DB_CONFIG.MONGODB_SERVER_PORT = '42100';
  DB_CONFIG.POSTGRES_SERVER_PORT = '42200';
  DB_CONFIG.PROXYSQL_SERVER_PORT = '46032';
}

if (process.env.OVF_TEST === 'yes') {
  PMM_SERVER_OVF_AMI_SETUP = 'true';
  SERVER_HOST = process.env.SERVER_IP;
  EXTERNAL_EXPORTER_HOST = process.env.SERVER_IP;
  DB_CONFIG.POSTGRES_SERVER_PORT = '5433';
}

module.exports = {
  remote_instance: {
    mysql: {
      ps_5_7: {
        host: (PMM_SERVER_OVF_AMI_SETUP === 'true' ? SERVER_HOST : 'mysql'),
        port: DB_CONFIG.MYSQL_SERVER_PORT,
        username: 'pmm-agent',
        password: 'pmm%*&agent-password',
        clusterName: 'mysql_clstr',
      },
      ps_8_0: {
        host: 'mysql8',
        port: '3307',
        username: 'pmm-agent',
        password: 'pmm-agent-password',
        clusterName: 'mysql_clstr',
      },
      ms_8_0_ssl: {
        host: '192.168.0.1',
        port: '3308',
        username: 'root',
        password: 'r00tr00t',
        clusterName: 'mysql-ssl-cluster',
        environment: 'mysql-ssl-env',
        tlsCAFile: '/tmp/ssl/pmm-ui-tests/testdata/mysql/ssl-cert-scripts/certs/root-ca.pem',
        tlsCertificateKeyFile: '/tmp/ssl/pmm-ui-tests/testdata/mysql/ssl-cert-scripts/certs/client-key.pem',
        tlsCertificateFile: '/tmp/ssl/pmm-ui-tests/testdata/mysql/ssl-cert-scripts/certs/client-cert.pem',
      },
    },
    mongodb: {
      psmdb_4_2: {
        host: (PMM_SERVER_OVF_AMI_SETUP === 'true' ? SERVER_HOST : 'mongo'),
        port: DB_CONFIG.MONGODB_SERVER_PORT,
        username: 'root',
        password: 'root-!@#%^password',
        clusterName: 'mongo_clstr',
      },
      mongodb_4_4_ssl: {
        host: '192.168.0.1',
        port: '27018',
        clusterName: 'mongo-ssl-cluster',
        environment: 'mongo-ssl-env',
        tlsCAFile: '/tmp/ssl/pmm-ui-tests/testdata/mongodb/certs/ca.crt',
        tlsCertificateKeyFile: '/tmp/ssl/pmm-ui-tests/testdata/mongodb/certs/client.pem',
        tlsCertificateKeyFilePassword: '/tmp/ssl/pmm-ui-tests/testdata/mongodb/certs/client.key',
      },
    },
    postgresql: {
      pdpgsql_13_3: {
        host: (PMM_SERVER_OVF_AMI_SETUP === 'true' ? SERVER_HOST : 'postgres'),
        port: DB_CONFIG.POSTGRES_SERVER_PORT,
        username: 'postgres',
        password: 'pmm-^*&@agent-password',
        clusterName: 'pgsql_clstr',
      },
      postgres_13_3_ssl: {
        host: '192.168.0.1',
        port: '5439',
        clusterName: 'postgresql-ssl-cluster',
        environment: 'postgresql-ssl-env',
        tlsCAFile: '/tmp/ssl/pmm-ui-tests/testdata/pgsql/ssl-cert-scripts/certs/root-ca.pem',
        tlsCertFile: '/tmp/ssl/pmm-ui-tests/testdata/pgsql/ssl-cert-scripts/certs/client-cert.pem',
        tlsKeyFile: '/tmp/ssl/pmm-ui-tests/testdata/pgsql/ssl-cert-scripts/certs/client-key.pem',
      },
    },
    proxysql: {
      proxysql_2_1_1: {
        host: (PMM_SERVER_OVF_AMI_SETUP === 'true' ? SERVER_HOST : 'proxysql'),
        port: DB_CONFIG.PROXYSQL_SERVER_PORT,
        username: 'radmin',
        password: 'radmin',
        clusterName: 'proxy_clstr',
      },
    },
    haproxy: {
      haproxy_2: {
        host: (PMM_SERVER_OVF_AMI_SETUP === 'true' ? EXTERNAL_EXPORTER_HOST : '192.168.0.1'),
        port: '42100',
        clusterName: 'haproxy_clst',
      },
    },
    external: {
      redis: {
        host: (PMM_SERVER_OVF_AMI_SETUP === 'true' ? EXTERNAL_EXPORTER_HOST : '192.168.0.1'),
        port: '42200',
        clusterName: 'redis_external_exporter',
        environment: 'redis_external',
        group: 'redis-remote',
        metricsPath: '/metrics',
        schema: 'http',
      },
    },
    aws: {
      aws_access_key: process.env.AWS_ACCESS_KEY_ID,
      aws_secret_key: process.env.AWS_SECRET_ACCESS_KEY,
      aws_rds_5_7: {
        address: process.env.REMOTE_AWS_MYSQL57_HOST,
        username: process.env.REMOTE_AWS_MYSQL_USER,
        password: process.env.REMOTE_AWS_MYSQL_PASSWORD,
        clusterName: 'aws_rds_mysql_5_7',
        port: 3306,
      },
      aws_rds_8_0: {
        address: secret(process.env.REMOTE_AWS_MYSQL80_HOST),
        username: secret(process.env.REMOTE_AWS_MYSQL80_USER),
        password: secret(process.env.REMOTE_AWS_MYSQL80_PASSWORD),
        clusterName: 'aws_rds_mysql_8_0',
        port: 3306,
      },
      aws_rds_5_6: {
        address: secret(process.env.REMOTE_AWS_MYSQL57_HOST),
        username: secret(process.env.REMOTE_AWS_MYSQL_USER),
        password: secret(process.env.REMOTE_AWS_MYSQL_PASSWORD),
        clusterName: 'aws_rds_mysql_5_6',
        port: 3306,
      },
      aws_postgresql_12: {
        userName: secret(process.env.REMOTE_AWS_POSTGRES12_USER),
        password: secret(process.env.REMOTE_AWS_POSTGRES12_PASSWORD),
        clusterName: 'aws_postgresql_12',
        port: 5432,
      },
      aurora: {   
        aws_access_key: process.env.PMM_QA_AWS_ACCESS_KEY_ID,
        aws_secret_key: process.env.PMM_QA_AWS_ACCESS_KEY,
        port: '42001',
        username: 'pmm',
        aurora2: {
          address: process.env.PMM_QA_AURORA2_MYSQL_HOST,
          password: process.env.PMM_QA_AURORA2_MYSQL_PASSWORD,
          instance_id: "pmm-qa-aurora2-mysql-instance-1",
          cluster_name: 'aws_aurora2',
        },
        aurora3: {
          address: process.env.PMM_QA_AURORA3_MYSQL_HOST,
          password: process.env.PMM_QA_AURORA3_MYSQL_PASSWORD,
          instance_id: "pmm-qa-aurora3-mysql-instance-1",
          cluster_name: 'aws_aurora3',
        },
      },
    },
    azure: {
      azure_client_id: secret(process.env.AZURE_CLIENT_ID),
      azure_client_secret: secret(process.env.AZURE_CLIENT_SECRET),
      azure_tenant_id: secret(process.env.AZURE_TENNANT_ID),
      azure_subscription_id: secret(process.env.AZURE_SUBSCRIPTION_ID),
      azure_mysql: {
        userName: secret(process.env.AZURE_MYSQL_USER),
        password: secret(process.env.AZURE_MYSQL_PASS),
      },
      azure_postgresql: {
        userName: secret(process.env.AZURE_POSTGRES_USER),
        password: secret(process.env.AZURE_POSTGRES_PASS),
      },
    },
    gc: {
      gc_postgresql: {
        address: process.env.GCP_SERVER_IP,
        userName: process.env.GCP_USER,
        password: process.env.GCP_USER_PASSWORD,
      },
      gc_mysql57: {
        type: 'mysql',
        serviceName: 'gc-mysql57',
        port: '3306',
        host: secret(process.env.GCP_MYSQL57_HOST),
        username: secret(process.env.GCP_MYSQL57_USER),
        password: secret(process.env.GCP_MYSQL57_PASSWORD),
        cluster: 'gc-mysql57',
        environment: 'gc-mysql57',
      },
      gc_mysql80: {
        type: 'mysql',
        serviceName: 'gc-mysql80',
        port: '3306',
        host: secret(process.env.GCP_MYSQL80_HOST),
        username: secret(process.env.GCP_MYSQL80_USER),
        password: secret(process.env.GCP_MYSQL80_PASSWORD),
        cluster: 'gc-mysql80',
        environment: 'gc-mysql80',
      },
      gc_mysql56: {
        type: 'mysql',
        // service name used here intentionally include mysql because we are checking QAN and exporter agent status both
        serviceName: 'gc-mysql56',
        port: '3306',
        host: secret(process.env.GCP_MYSQL56_HOST),
        username: secret(process.env.GCP_MYSQL56_USER),
        password: secret(process.env.GCP_MYSQL56_PASSWORD),
        cluster: 'gc-mysql56',
        environment: 'gc-mysql56',
      },
      gc_pgsql_13: {
        type: 'postgresql',
        // using postgres in name makes sure both exporter and QAN agents are verified
        serviceName: 'gc-postgres13',
        port: '5432',
        database: process.env.GCP_PGSQL13_USER,
        host: secret(process.env.GCP_PGSQL13_HOST),
        username: secret(process.env.GCP_PGSQL13_USER),
        password: secret(process.env.GCP_PGSQL13_PASSWORD),
        cluster: 'gc-pgsql13',
        environment: 'gc-pgsql13',
      },
      gc_pgsql_12: {
        type: 'postgresql',
        // using postgres in name makes sure both exporter and QAN agents are verified
        serviceName: 'gc-postgres12',
        port: '5432',
        database: process.env.GCP_PGSQL12_USER,
        host: secret(process.env.GCP_PGSQL12_HOST),
        username: secret(process.env.GCP_PGSQL12_USER),
        password: secret(process.env.GCP_PGSQL12_PASSWORD),
        cluster: 'gc-pgsql12',
        environment: 'gc-pgsql12',
      },
      gc_pgsql_14: {
        type: 'postgresql',
        // using postgres in name makes sure both exporter and QAN agents are verified
        serviceName: 'gc-postgres14',
        port: '5432',
        database: process.env.GCP_PGSQL14_USER,
        host: secret(process.env.GCP_PGSQL14_HOST),
        username: secret(process.env.GCP_PGSQL14_USER),
        password: secret(process.env.GCP_PGSQL14_PASSWORD),
        cluster: 'gc-pgsql14',
        environment: 'gc-pgsql14',
      },
      gc_pgsql_11: {
        type: 'postgresql',
        // using postgres in name makes sure both exporter and QAN agents are verified
        serviceName: 'gc-postgres11',
        port: '5432',
        database: process.env.GCP_PGSQL11_USER,
        host: secret(process.env.GCP_PGSQL11_HOST),
        username: secret(process.env.GCP_PGSQL11_USER),
        password: secret(process.env.GCP_PGSQL11_PASSWORD),
        cluster: 'gc-pgsql11',
        environment: 'gc-pgsql11',
      },
      gc_pgsql_10: {
        type: 'postgresql',
        // using postgres in name makes sure both exporter and QAN agents are verified
        serviceName: 'gc-postgres10',
        port: '5432',
        database: process.env.GCP_PGSQL10_USER,
        host: secret(process.env.GCP_PGSQL10_HOST),
        username: secret(process.env.GCP_PGSQL10_USER),
        password: secret(process.env.GCP_PGSQL10_PASSWORD),
        cluster: 'gc-pgsql10',
        environment: 'gc-pgsql10',
      },
      gc_pgsql_96: {
        type: 'postgresql',
        // using postgres in name makes sure both exporter and QAN agents are verified
        serviceName: 'gc-postgres96',
        port: '5432',
        database: process.env.GCP_PGSQL96_USER,
        host: secret(process.env.GCP_PGSQL96_HOST),
        username: secret(process.env.GCP_PGSQL96_USER),
        password: secret(process.env.GCP_PGSQL96_PASSWORD),
        cluster: 'gc-pgsql96',
        environment: 'gc-pgsql96',
      },
    },
  },

  // Used for Adding Remote Instance during Upgrade Tests runs for AMI and Docker via API
  instanceTypes: {
    mysql: (remoteInstanceStatus.mysql.ps_5_7.enabled ? 'MySQL' : undefined),
    postgresql: (remoteInstanceStatus.postgresql.pdpgsql_13_3.enabled ? 'PostgreSQL' : undefined),
    mongodb: (remoteInstanceStatus.mongodb.psmdb_4_2.enabled ? 'MongoDB' : undefined),
    proxysql: (remoteInstanceStatus.proxysql.proxysql_2_1_1.enabled ? 'ProxySQL' : undefined),
    rds: (remoteInstanceStatus.aws.aws_rds_5_7.enabled ? 'RDS' : undefined),
    rdsAurora: (remoteInstanceStatus.aurora.aurora2.enabled ? 'RDSAurora' : undefined),
    postgresGC: (remoteInstanceStatus.gc.gc_postgresql.enabled ? 'postgresGC' : undefined),
  },

  // Generic object for each service type, used by both UI/Upgrade jobs depending on the service being used - don't add RDS here
  serviceTypes: {
    mysql: (
      remoteInstanceStatus.mysql.ps_5_7.enabled ? {
        serviceType: 'MYSQL_SERVICE',
        service: 'mysql',
      } : undefined
    ),
    mongodb: (
      remoteInstanceStatus.mongodb.psmdb_4_2.enabled ? {
        serviceType: 'MONGODB_SERVICE',
        service: 'mongodb',
      } : undefined
    ),
    postgresql: (
      remoteInstanceStatus.postgresql.pdpgsql_13_3.enabled ? {
        serviceType: 'POSTGRESQL_SERVICE',
        service: 'postgresql',
      } : undefined
    ),
    proxysql: (
      remoteInstanceStatus.proxysql.proxysql_2_1_1.enabled ? {
        serviceType: 'PROXYSQL_SERVICE',
        service: 'proxysql',
      } : undefined
    ),
    postgresGC: (
      remoteInstanceStatus.gc.gc_postgresql.enabled ? {
        serviceType: 'POSTGRESQL_SERVICE',
        service: 'postgresql',
      } : undefined
    ),
    mysql_ssl: (
      remoteInstanceStatus.mysql.ms_8_0_ssl.enabled ? {
        serviceType: 'MYSQL_SERVICE',
        service: 'mysql',
      } : undefined
    ),
    mongodb_ssl: (
      remoteInstanceStatus.mongodb.mongodb_4_4_ssl.enabled ? {
        serviceType: 'MONGODB_SERVICE',
        service: 'mongodb',
      } : undefined
    ),
    postgres_ssl: (
      remoteInstanceStatus.postgresql.postgres_13_3_ssl.enabled ? {
        serviceType: 'POSTGRESQL_SERVICE',
        service: 'postgresql',
      } : undefined
    ),
  },

  // General Remote Instances Service List, this is what UI-tests job uses to run remote instances tests.
  services: {
    mysql: (remoteInstanceStatus.mysql.ps_5_7.enabled ? 'mysql_remote_new' : undefined),
    mongodb: (remoteInstanceStatus.mongodb.psmdb_4_2.enabled ? 'mongodb_remote_new' : undefined),
    postgresql: (remoteInstanceStatus.postgresql.pdpgsql_13_3.enabled ? 'postgresql_remote_new' : undefined),
    proxysql: (remoteInstanceStatus.proxysql.proxysql_2_1_1.enabled ? 'proxysql_remote_new' : undefined),
    postgresGC: (remoteInstanceStatus.gc.gc_postgresql.enabled ? 'postgresql_GC_remote_new' : undefined),
    mysql_ssl: (remoteInstanceStatus.mysql.ms_8_0_ssl.enabled ? 'mysql_ssl_new' : undefined),
    mongodb_ssl: (remoteInstanceStatus.mongodb.mongodb_4_4_ssl.enabled ? 'mongodb_ssl_new' : undefined),
    postgres_ssl: (remoteInstanceStatus.postgresql.postgres_13_3_ssl.enabled ? 'postgres_ssl_new' : undefined),
  },

  // Only add a service here when you want to include it as part of Upgrade tests cycle for AMI and Docker
  upgradeServiceNames: {
    mysql: (remoteInstanceStatus.mysql.ps_5_7.enabled ? 'mysql_upgrade_service' : undefined),
    mongodb: (remoteInstanceStatus.mongodb.psmdb_4_2.enabled ? 'psmdb_upgrade_scervice' : undefined),
    proxysql: (remoteInstanceStatus.proxysql.proxysql_2_1_1.enabled ? 'proxysql_upgrade_service' : undefined),
    postgresql: (remoteInstanceStatus.postgresql.pdpgsql_13_3.enabled ? 'postgres_upgrade_service' : undefined),
    rds: (remoteInstanceStatus.aws.aws_rds_5_7.enabled ? 'mysql_rds_uprgade_service' : undefined),
    rdsaurora: (remoteInstanceStatus.aurora.aurora2.enabled ? 'aurora_rds_upgrade_service' : undefined),
    postgresgc: (remoteInstanceStatus.gc.gc_postgresql.enabled ? 'postgresql_GC_remote_new' : undefined),
  },

  // Metrics that needs to be checked post upgrade for each Service, only used by Docker Upgrade & AMI upgrade
  upgradeServiceMetricNames: {
    mysql_upgrade_service: 'mysql_global_status_max_used_connections',
    psmdb_upgrade_scervice: 'mongodb_connections',
    proxysql_upgrade_service: 'proxysql_stats_memory_auth_memory',
    postgres_upgrade_service: 'pg_stat_database_xact_rollback',
    mysql_rds_uprgade_service: 'mysql_global_status_max_used_connections',
  },

  // Used by Upgrade Job to test QAN filters
  qanFilters: ['mysql', 'mongodb', 'postgresql', 'rds', 'rdsaurora'],

  getInstanceStatus(instance) {
    return remoteInstanceStatus[Object.keys(remoteInstanceStatus).filter((dbtype) => dbtype === instance)];
  },
};
