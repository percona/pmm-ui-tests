const SERVICE_TYPE = {
  UNSPECIFIED: 'SERVICE_TYPE_UNSPECIFIED',
  MYSQL: 'SERVICE_TYPE_MYSQL_SERVICE',
  MONGODB: 'SERVICE_TYPE_MONGODB_SERVICE',
  POSTGRESQL: 'SERVICE_TYPE_POSTGRESQL_SERVICE',
  PROXYSQL: 'SERVICE_TYPE_PROXYSQL_SERVICE',
  HAPROXY: 'SERVICE_TYPE_HAPROXY_SERVICE',
  EXTERNAL: 'SERVICE_TYPE_EXTERNAL_SERVICE',
};

const NODE_STATUS = {
  UNSPECIFIED: 'STATUS_UNSPECIFIED',
  UP: 'STATUS_UP',
  DOWN: 'STATUS_DOWN',
  UNKNOWN: 'STATUS_UNKNOWN',
};

const AGENT_STATUS = {
  UNSPECIFIED: 'AGENT_STATUS_UNSPECIFIED',
  STARTING: 'AGENT_STATUS_STARTING',
  RUNNING: 'AGENT_STATUS_RUNNING',
  WAITING: 'AGENT_STATUS_WAITING',
  STOPPING: 'AGENT_STATUS_STOPPING',
  DONE: 'AGENT_STATUS_DONE',
  UNKNOWN: 'AGENT_STATUS_UNKNOWN',
};

const CLI_AGENT_STATUS = {
  UNSPECIFIED: 'UNSPECIFIED',
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING',
  STOPPING: 'STOPPING',
  DONE: 'DONE',
  UNKNOWN: 'UNKNOWN',
};

const NODE_TYPE = {
  UNSPECIFIED: 'NODE_TYPE_UNSPECIFIED',
  GENERIC: 'NODE_TYPE_GENERIC_NODE',
  CONTAINER: 'NODE_TYPE_CONTAINER_NODE',
  REMOTE: 'NODE_TYPE_REMOTE_NODE',
  REMOTE_RDS: 'NODE_TYPE_REMOTE_RDS_NODE',
  REMOTE_AZURE: 'NODE_TYPE_REMOTE_AZURE_DATABASE_NODE',
};

const DISCOVER_RDS = {
  UNSPECIFIED: 'DISCOVER_RDS_ENGINE_UNSPECIFIED',
  MYSQL: 'DISCOVER_RDS_ENGINE_MYSQL',
  POSTGRESQL: 'DISCOVER_RDS_ENGINE_POSTGRESQL',
};

const AGENT_TYPE = {
  VMAGENT: 'vm-agent',
  MONGODB_EXPORTER: 'mongodb_exporter',
  QAN_MONGODB_PROFILER: 'qan-mongodb-profiler-agent',
  PMM_AGENT: 'pmm-agent',
};

module.exports = {
  SERVICE_TYPE,
  NODE_STATUS,
  AGENT_STATUS,
  CLI_AGENT_STATUS,
  NODE_TYPE,
  DISCOVER_RDS,
  AGENT_TYPE,
};
