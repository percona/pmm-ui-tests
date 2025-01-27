interface PmmFrameworkService {
  containerName: string;
  serviceName: string;
  standardMetric: string;
  serviceType: 'mysql' | 'postgresql' | 'mongodb';
  username: string,
  password: string,
  port: number,
}

const pgsql:PmmFrameworkService = {
  containerName: 'pgsql_pgss_pmm',
  serviceName: 'pgsql_pgss_pmm',
  standardMetric: 'mysql_global_status_max_used_connections',
  serviceType: 'postgresql',
  username: 'pmm',
  password: 'pmm',
  port: 3306,
}

const ps:PmmFrameworkService = {
  containerName: 'ps_pmm',
  serviceName: 'ps-single',
  standardMetric: 'mysql_global_status_max_used_connections',
  serviceType: 'mysql',
  username: 'root',
  password: 'GRgrO9301RuF',
  port: 5432,
}

const psmdb:PmmFrameworkService = {
  containerName: 'rs101',
  serviceName: 'rs101',
  standardMetric: 'mongodb_connections',
  serviceType: 'mongodb',
  username: 'dba',
  password: 'test1234',
  port: 27027,
}

export const pmmFrameworkServices = {
  pgsql,
  ps,
  psmdb
}