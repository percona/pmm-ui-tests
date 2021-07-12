const { I } = inject();

const remoteInstanceStatus = {
  mysql: {
    ps_5_7: {
      enabled: true,
    },
    ps_8_0: {
      enabled: true,
    },
  },
  mongodb: {
    psmdb_4_2: {
      enabled: true,
    },
  },
  postgresql: {
    pdpgsql_13_3: {
      enabled: true,
    },
  },
  proxysql: {
    proxysql_2_1_1: {
      enabled: true,
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
};
let PMM_SERVER_OVF_AMI_SETUP;
let SERVER_HOST;
let POSTGRESQL_PORT;
let EXTERNAL_EXPORTER_HOST;

if (process.env.AMI_UPGRADE_TESTING_INSTANCE === 'true') {
  PMM_SERVER_OVF_AMI_SETUP = 'true';
  SERVER_HOST = '127.0.0.1';
  POSTGRESQL_PORT = '5433';
  EXTERNAL_EXPORTER_HOST = process.env.VM_CLIENT_IP;
} else if (process.env.OVF_TEST === 'yes') {
  PMM_SERVER_OVF_AMI_SETUP = 'true';
  SERVER_HOST = process.env.SERVER_IP;
  POSTGRESQL_PORT = '5432';
  EXTERNAL_EXPORTER_HOST = process.env.SERVER_IP;
} else {
  PMM_SERVER_OVF_AMI_SETUP = 'false';
}

module.exports = {
  remote_instance: {
    mysql: {
      ps_5_7: {
        host: (PMM_SERVER_OVF_AMI_SETUP === 'true' ? SERVER_HOST : 'mysql'),
        port: '3306',
        username: 'pmm-agent',
        password: 'pmm%*&agent-password',
        clusterName: 'mysql_clstr',
      },
      ps_8_0: {
        host: 'mysql8',
        port: '3306',
        username: 'pmm-agent',
        password: 'pmm-agent-password',
        clusterName: 'mysql_clstr',
      },
    },
    mongodb: {
      psmdb_4_2: {
        host: (PMM_SERVER_OVF_AMI_SETUP === 'true' ? SERVER_HOST : 'mongo'),
        port: '27017',
        username: 'root',
        password: 'root-!@#%^password',
        clusterName: 'mongo_clstr',
      },
    },
    postgresql: {
      pdpgsql_13_3: {
        host: (PMM_SERVER_OVF_AMI_SETUP === 'true' ? SERVER_HOST : 'postgres'),
        port: (PMM_SERVER_OVF_AMI_SETUP === 'true' ? POSTGRESQL_PORT : '5432'),
        username: 'postgres',
        password: 'pmm-^*&@agent-password',
        clusterName: 'pgsql_clstr',
      },
    },
    proxysql: {
      proxysql_2_1_1: {
        host: (PMM_SERVER_OVF_AMI_SETUP === 'true' ? '127.0.0.1' : 'proxysql'),
        port: '6032',
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
      aws_rds_5_6: {
        address: process.env.REMOTE_AWS_MYSQL57_HOST,
        username: process.env.REMOTE_AWS_MYSQL_USER,
        password: process.env.REMOTE_AWS_MYSQL_PASSWORD,
        clusterName: 'aws_rds_mysql_5_6',
        port: 3306,
      },
      aws_postgresql_12: {
        userName: process.env.REMOTE_AWS_POSTGRES12_USER,
        password: process.env.REMOTE_AWS_POSTGRES12_PASSWORD,
        clusterName: 'aws_postgresql_12',
        port: 5432,
      },
    },
    azure: {
      azure_client_id: process.env.AZURE_CLIENT_ID,
      azure_client_secret: process.env.AZURE_CLIENT_SECRET,
      azure_tenant_id: process.env.AZURE_TENNANT_ID,
      azure_subscription_id: process.env.AZURE_SUBSCRIPTION_ID,
      azure_mysql: {
        userName: process.env.AZURE_MYSQL_USER,
        password: process.env.AZURE_MYSQL_PASS,
      },
      azure_postgresql: {
        userName: process.env.AZURE_POSTGRES_USER,
        password: process.env.AZURE_POSTGRES_PASS,
      },
    },
  },

  instanceTypes: {
    mysql: (remoteInstanceStatus.mysql.ps_5_7.enabled ? 'MySQL' : undefined),
    postgresql: (remoteInstanceStatus.postgresql.pdpgsql_13_3.enabled ? 'PostgreSQL' : undefined),
    mongodb: (remoteInstanceStatus.mongodb.psmdb_4_2.enabled ? 'MongoDB' : undefined),
    proxysql: (remoteInstanceStatus.proxysql.proxysql_2_1_1.enabled ? 'ProxySQL' : undefined),
    rds: (remoteInstanceStatus.aws.aws_rds_5_7.enabled ? 'RDS' : undefined),
  },

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
  },

  services: {
    mysql: (remoteInstanceStatus.mysql.ps_5_7.enabled ? 'mysql_remote_new' : undefined),
    mongodb: (remoteInstanceStatus.mongodb.psmdb_4_2.enabled ? 'mongodb_remote_new' : undefined),
    postgresql: (remoteInstanceStatus.postgresql.pdpgsql_13_3.enabled ? 'postgresql_remote_new' : undefined),
    proxysql: (remoteInstanceStatus.proxysql.proxysql_2_1_1.enabled ? 'proxysql_remote_new' : undefined),
  },

  upgradeServiceNames: {
    mysql: (remoteInstanceStatus.mysql.ps_5_7.enabled ? 'mysql_upgrade_service' : undefined),
    mongodb: (remoteInstanceStatus.mongodb.psmdb_4_2.enabled ? 'mongodb_upgrade_scervice' : undefined),
    proxysql: (remoteInstanceStatus.proxysql.proxysql_2_1_1.enabled ? 'proxysql_upgrade_service' : undefined),
    postgresql: (remoteInstanceStatus.postgresql.pdpgsql_13_3.enabled ? 'postgres_upgrade_service' : undefined),
    rds: (remoteInstanceStatus.aws.aws_rds_5_7.enabled ? 'mysql_rds_uprgade_service' : undefined),
  },

  qanFilters: ['mysql', 'mongodb', 'postgresql', 'rds'],

  getInstanceStatus(instance) {
    return remoteInstanceStatus[Object.keys(remoteInstanceStatus).filter((dbtype) => dbtype === instance)];
  },
};
