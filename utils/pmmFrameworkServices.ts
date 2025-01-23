interface PmmFrameworkService {
  containerName: string;
  standardMetric: string;
  serviceType: 'mysql' | 'postgresql';
  username: string,
  password: string,
}

const pgsql:PmmFrameworkService = {
  containerName: 'pgsql_pgss_pmm',
  standardMetric: 'mysql_global_status_max_used_connections',
  serviceType: 'postgresql',
  username: 'pmm',
  password: 'pmm',
}

export const pmmFrameworkServices = {
  pgsql
}