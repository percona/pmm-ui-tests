const {remoteInstancesHelper} = inject();

const filterOperators = {
  equal: '= (EQUAL)',
  regex: '=~ (REGEX)',
};

module.exports = {
  postgresGCSettings: {
    environment: 'Remote PostgreSQL_GC env new',
    cluster: 'Remote PostgreSQL_GC cluster new',
    replicationSet: 'Remote PostgreSQL_GC replica-new',
  },
  mysqlSettings: {
    environment: 'remote-mysql-new',
    cluster: 'remote-mysql-cluster-new',
    replicationSet: 'remote-mysql-replica-new',
  },
  potgresqlSettings: {
    environment: 'remote-postgres-new',
    cluster: 'remote-postgres-cluster-new',
    replicationSet: 'remote-postgres-replica-new',
  },
  mongodbSettings: {
    environment: 'remote-mongodb-new',
    cluster: 'remote-mongodb-cluster-new',
    replicationSet: 'remote-mongodb-replica-new',
  },
  proxysqlSettings: {
    environment: 'remote-proxysql-new',
    cluster: 'remote-proxysql-cluster-new',
    replicationSet: 'remote-proxysql-replica-new',
  },
  externalSettings: {
    environment: 'remote-external-service-new',
    cluster: 'remote-external-cluster-new',
    replicationSet: 'remote-external-replica-new',
  },
  postgresqlAzureInputs: {
    environment: 'Azure PostgreSQL environment new',
    cluster: 'Azure PostgreSQL cluster new',
    replicationSet: 'Azure PostgreSQL replica new',
  },
  mysqlAzureInputs: {
    environment: 'Azure MySQL environment new',
    cluster: 'Azure MySQL cluster new',
    replicationSet: 'Azure MySQL replica new',
  },
  mysqlInputs: {
    environment: 'RDS MySQL 5.6 new',
    cluster: 'rds56-cluster new',
    replicationSet: 'rds56-replication new',
  },
  mysql57rdsInput: {
    environment: 'RDS MySQL 5.7 new',
    cluster: 'rds57-cluster new',
    replicationSet: 'rds57-replication new',
  },
  mysql80rdsInput: {
    environment: 'RDS MySQL 8.0 new',
    cluster: 'rds80-cluster new',
    replicationSet: 'rds80-replication new',
  },
  postgresqlInputs: {
    environment: 'RDS Postgres new',
    cluster: 'rdsPostgres-cluster new',
    replicationSet: 'rdsPostgres-replication new',
  },
  aurora2Inputs: {
    environment: 'Aurora2 Postgres new',
    cluster: 'Aurora2-cluster new',
    replicationSet: 'Aurora2-replication new',
  },
  aurora3Inputs: {
    environment: 'Aurora2 Postgres new',
    cluster: 'Aurora2-cluster new',
    replicationSet: 'Aurora2-replication new',
  },
  haproxy: {
    environment: 'Haproxy Postgres new',
    cluster: 'Haproxy-cluster new',
    replicationSet: 'Haproxy-replication new',
  },
};
