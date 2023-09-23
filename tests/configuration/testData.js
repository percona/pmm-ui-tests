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
    userName: remoteInstancesHelper.remote_instance.azure.azure_postgresql.userName,
    password: remoteInstancesHelper.remote_instance.azure.azure_postgresql.password,
    environment: 'Azure PostgreSQL environment new',
    cluster: 'Azure PostgreSQL cluster new',
    replicationSet: 'Azure PostgreSQL replica new',
  },
  mysqlAzureInputs: {
    userName: remoteInstancesHelper.remote_instance.azure.azure_mysql.userName,
    password: remoteInstancesHelper.remote_instance.azure.azure_mysql.password,
    environment: 'Azure MySQL environment new',
    cluster: 'Azure MySQL cluster new',
    replicationSet: 'Azure MySQL replica new',
  },
  mysqlInputs: {
    userName: remoteInstancesHelper.remote_instance.aws.aws_rds_5_6.username,
    password: remoteInstancesHelper.remote_instance.aws.aws_rds_5_6.password,
    environment: 'RDS MySQL 5.6 new',
    cluster: 'rds56-cluster new',
    replicationSet: 'rds56-replication new',
  },
  mysql57rdsInput: {
    userName: remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.username,
    password: remoteInstancesHelper.remote_instance.aws.aws_rds_5_7.password,
    environment: 'RDS MySQL 5.7 new',
    cluster: 'rds57-cluster new',
    replicationSet: 'rds57-replication new',
  },
  mysql80rdsInput: {
    userName: remoteInstancesHelper.remote_instance.aws.aws_rds_8_0.username,
    password: remoteInstancesHelper.remote_instance.aws.aws_rds_8_0.password,
    environment: 'RDS MySQL 8.0 new',
    cluster: 'rds80-cluster new',
    replicationSet: 'rds80-replication new',
  },
  postgresqlInputs: {
    userName: remoteInstancesHelper.remote_instance.aws.aws_postgresql_12.userName,
    password: remoteInstancesHelper.remote_instance.aws.aws_postgresql_12.password,
    environment: 'RDS Postgres new',
    cluster: 'rdsPostgres-cluster new',
    replicationSet: 'rdsPostgres-replication new',
  },
};
