interface PmmFrameworkService {
  containerName: string;
  serviceName: string;
  standardMetric: string;
  serviceType: 'mysql' | 'postgresql' | 'mongodb';
  username: string,
  password: string,
}

const pgsql:PmmFrameworkService = {
  containerName: 'pgsql_pgss_pmm',
  serviceName: 'pgsql_pgss_pmm',
  standardMetric: 'mysql_global_status_max_used_connections',
  serviceType: 'postgresql',
  username: 'pmm',
  password: 'pmm',
}

const ps:PmmFrameworkService = {
  containerName: 'ps_pmm',
  serviceName: 'ps-single',
  standardMetric: 'mysql_global_status_max_used_connections',
  serviceType: 'mysql',
  username: 'root',
  password: 'GRgrO9301RuF',
}

const psmdb:PmmFrameworkService = {
  containerName: 'rs101',
  serviceName: 'rs101',
  standardMetric: 'mongodb_connections',
  serviceType: 'mongodb',
  username: 'pmm_mongodb',
  password: '5M](Q%q/U+YQ<^m',
}

export const pmmFrameworkServices = {
  pgsql,
  ps,
  psmdb
}