const {
  LeftMenu, SubMenu, menuOption,
} = require('./menuTemplates.js');

const pmmD = 'PMM dashboards';

/**
 * Implements left Navigation Grafana Menu. Intended to be used UX goes, ex.:
 *    leftNavMenu.pmmDashboards.menu.systemNode.menu.nodeOverview.click()
 */
module.exports = {
  search: new LeftMenu('Search', '?search=open'),
  create: new LeftMenu('Create', '/graph/dashboard/new',
    {
      dashboard: menuOption('Create', 'Dashboard', '/graph/dashboard/new?orgId=1'),
      folder: menuOption('Create', 'Folder', '/graph/dashboards/folder/new'),
      import: menuOption('Create', 'Import', '/graph/dashboard/import'),
    }),
  dashboards: new LeftMenu('Dashboards', '/graph/',
    {
      home: menuOption('Dashboards', 'Home', '/graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m'),
      manage: menuOption('Dashboards', 'Manage', '/graph/dashboards'),
      playlists: menuOption('Dashboards', 'Playlists', '/graph/playlists'),
      snapshots: menuOption('Dashboards', 'Snapshots', '/graph/dashboard/snapshots'),
    }),
  pmmDashboards: new LeftMenu('PMM dashboards', 'graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m',
    {
      queryAnalytics: menuOption(pmmD, 'Query Analytics', '/graph/d/pmm-qan/pmm-query-analytics'),
      systemNode: new SubMenu(pmmD, 'System (Node)', '/graph/d/node-instance-overview/',
        {
          nodeOverview: menuOption(pmmD, 'Node Overview', '/graph/d/node-instance-overview/', 2),
          nodeSummary: new SubMenu(pmmD, 'Node Summary', '/graph/d/node-instance-summary/',
            {
              cpuUtilizationDetails: menuOption(pmmD, 'CPU Utilization', '/graph/d/node-cpu/cpu-utilization-details', 3),
              disk: menuOption(pmmD, 'Disk', '/graph/d/node-disk/disk-details', 3),
              memory: menuOption(pmmD, 'Memory', '/graph/d/node-memory/memory-details', 3),
              network: menuOption(pmmD, 'Network', '/graph/d/node-network/network-details', 3),
              temperature: menuOption(pmmD, 'Temperature', '/graph/d/node-temp/node-temperature-details', 3),
              numa: menuOption(pmmD, 'NUMA', '/graph/d/node-memory-numa/numa-details', 3),
              processes: menuOption(pmmD, 'Processes', '/graph/d/node-cpu-process/processes-details', 3),
            }),
        }),
      mySql: new SubMenu(pmmD, 'MySQL', '/graph/d/mysql-instance-overview/mysql-instances-overview',
        {
          ha_HighAvailability: new SubMenu(pmmD, 'HA (High availability)', '#',
            {
              mySqlGroupReplicationSummary: menuOption(pmmD, 'MySQL Group Replication Summary', '/graph/d/mysql-group-replicaset-summary/mysql-group-replication-summary', 3),
              mySQLReplicationSummary: menuOption(pmmD, 'MySQL Replication Summary', '/graph/d/mysql-replicaset-summary/mysql-replication-summary', 3),
              pxc_galeraClusterSummary: menuOption(pmmD, 'PXC/Galera Cluster Summary', '/graph/d/pxc-cluster-summary/pxc-galera-cluster-summary', 3),
              pxc_galeraNodeSummary: menuOption(pmmD, 'PXC/Galera Node Summary', '/graph/d/pxc-node-summary/pxc-galera-node-summary', 3),
              pxc_galeraNodesCompare: menuOption(pmmD, 'PXC/Galera Nodes Compare', '/graph/d/pxc-nodes-compare/pxc-galera-nodes-compare', 3),
            }),
          mySqlOverview: menuOption(pmmD, 'MySQL Overview', '/graph/d/mysql-instance-overview/mysql-instances-overview', 2),
          mySqlSummary: new SubMenu(pmmD, 'MySQL Summary', '/graph/d/mysql-instance-summary/mysql-instance-summary',
            {
              MySqlCommand_HandlerCountersCompare: menuOption(pmmD, 'MySQL Command/Handler Counters Compare', '/graph/d/mysql-commandhandler-compare/mysql-command-handler-counters-compare', 3),
              mySqlInnoDbCompressionDetails: menuOption(pmmD, 'MySQL InnoDB Compression Details', '/graph/d/mysql-innodb-compression/mysql-innodb-compression-details', 3),
              mySqlInnoDbDetails: menuOption(pmmD, 'MySQL InnoDB Details', '/graph/d/mysql-innodb/mysql-innodb-details', 3),
              mySqlPerformanceSchemaDetails: menuOption(pmmD, 'MySQL Performance Schema Details', '/graph/d/mysql-performance-schema/mysql-performance-schema-details', 3),
              mySqlQueryResponseTimeDetails: menuOption(pmmD, 'MySQL Query Response Time Details', '/graph/d/mysql-queryresponsetime/mysql-query-response-time-details', 3),
              mySqlTableDetails: menuOption(pmmD, 'MySQL Table Details', '/graph/d/mysql-table/mysql-table-details', 3),
              mySqlTokuDbDetails: menuOption(pmmD, 'MySQL TokuDB Details', '/graph/d/mysql-tokudb/mysql-tokudb-details', 3),
              mySqlUserDetails: menuOption(pmmD, 'MySQL User Details', '/graph/d/mysql-user/mysql-user-details', 3),
              mySqlWaitEventAnalysesDetails: menuOption(pmmD, 'MySQL Wait Event Analyses Details', '/graph/d/mysql-waitevents-analysis/mysql-wait-event-analyses-details', 3),
              mySqlMyIsam_AriaDetails: menuOption(pmmD, 'MySQL MyISAM/Aria Details', '/graph/d/mysql-myisamaria/mysql-myisam-aria-details', 3),
              mySqlMyRocksDetails: menuOption(pmmD, 'MySQL MyRocks Details', '/graph/d/mysql-myrocks/mysql-myrocks-details', 3),
              mySqlAmazonAuroraDetails: menuOption(pmmD, 'MySQL Amazon Aurora Details', '/graph/d/mysql-amazonaurora/mysql-amazon-aurora-details', 3),
            }),
        }),
      mongoDb: new SubMenu(pmmD, 'MongoDB', '/graph/d/mongodb-instance-overview/mongodb-instances-overview',
        {
          ha_HighAvailability: new SubMenu(pmmD, 'HA (High availability)', '#',
            {
              mongoDbClusterSummary: menuOption(pmmD, 'MongoDB Cluster Summary', '/graph/d/mongodb-cluster-summary/mongodb-cluster-summary', 3),
              mongoDbReplSetSummary: menuOption(pmmD, 'MongoDB ReplSet Summary', '/graph/d/mongodb-replicaset-summary/mongodb-replset-summary', 3),
            }),
          mongoDbInstanceOverview: menuOption(pmmD, 'MongoDB Overview', '/graph/d/mongodb-instance-overview/mongodb-instances-overview', 2),
          mongoDbInstanceSummary: new SubMenu(pmmD, 'MongoDB Summary', '/graph/d/mongodb-instance-summary/mongodb-instance-summary',
            {
              mongoDbInMemoryDetails: menuOption(pmmD, 'MongoDB InMemory Details', '/graph/d/mongodb-inmemory/mongodb-inmemory-details', 3),
              mongoDbMmaPv1Details: menuOption(pmmD, 'MongoDB MMAPv1', '/graph/d/mongodb-mmapv1/mongodb-mmapv1-details', 3),
              mongoDbWiredTigerDetails: menuOption(pmmD, 'MongoDB WiredTiger Details', '/graph/d/mongodb-wiredtiger/mongodb-wiredtiger-details', 3),
            }),
        }),
      postgreSql: new SubMenu(pmmD, 'PostgreSQL', '/graph/d/postgresql-instance-overview/postgresql-instances-overview',
        {
          postgreSqlOverview: menuOption(pmmD, 'PostgreSQL Overview', '/graph/d/postgresql-instance-overview/postgresql-instances-overview', 2),
          postgreSqlSummary: menuOption(pmmD, 'PostgreSQL Summary', '/graph/d/postgresql-instance-summary/postgresql-instance-summary', 2),
        }),
      proxySql: menuOption(pmmD, 'ProxySQL', '/graph/d/proxysql-instance-summary/proxysql-instance-summary'),
      haProxy: menuOption(pmmD, 'HAProxy', '/graph/d/haproxy-instance-summary/haproxy-instance-summary'),
    }),
  explore: new LeftMenu('Explore', '/graph/explore'),
  alerting: new LeftMenu('Alerting', '/graph/alerting/list',
    {
      alertRules: menuOption('Alerting', 'Alert rules', '/graph/alerting/list'),
      notificationChannels: menuOption('Alerting', 'Notification channels', '/graph/alerting/notifications'),

    }),
  configuration: new LeftMenu('Configuration', '/graph/inventory',
    {
      pmmInventory: new SubMenu('Configuration', 'PMM Inventory', '/graph/inventory/services',
        {
          inventoryList: menuOption('Configuration', 'Inventory list', '/graph/inventory/services', 2),
          addInstance: menuOption('Configuration', 'Add instance', '/graph/add-instance', 2),
        }),
      settings: menuOption('Configuration', 'Settings', '/graph/settings/metrics-resolution'),
      dataSources: menuOption('Configuration', 'Data Sources', '/graph/datasources'),
      users: menuOption('Configuration', 'Users', '/graph/org/users'),
      teams: menuOption('Configuration', 'Teams', '/graph/org/teams'),
      plugins: menuOption('Configuration', 'Plugins', '/graph/plugins'),
      preferences: menuOption('Configuration', 'Preferences', '/graph/org'),
      apiKeys: menuOption('Configuration', 'API Keys', '/graph/org/apikeys'),
    }),
  serverAdmin: new LeftMenu('Server Admin', '/graph/admin/users',
    {
      users: menuOption('Server Admin', 'Server Admin', 'Users', '/graph/admin/users'),
      orgs: menuOption('Server Admin', 'Orgs', '/graph/admin/orgs'),
      settings: menuOption('Server Admin', 'Server Admin', 'Settings', '/graph/admin/settings'),
      stats: menuOption('Server Admin', 'Stats', '/graph/admin/stats'),
    }),
};
