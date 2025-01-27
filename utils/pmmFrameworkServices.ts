interface PmmFrameworkService {
  containerName: string;
  serviceName: string;
  standardMetric: string;
  serviceType: 'mysql' | 'postgresql';
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

export const pmmFrameworkServices = {
  pgsql,
  ps
}