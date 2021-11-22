const {
  LeftMenu, SubMenu, menuOption, duplicatedOption,
} = require('./menuTemplates.js');

/**
 * Implements left Navigation Grafana Menu. Intended to be used UX goes, ex.:
 *    leftNavMenu.pmmDashboards.menu.systemNode.menu.nodeOverview.click()
 */
module.exports = {
  search: new LeftMenu('Search', '?search=open'),
  create: new LeftMenu('Create', '/graph/dashboard/new',
    {
      dashboard: menuOption('Dashboard', '/graph/dashboard/new?orgId=1'),
      folder: menuOption('Folder', '/graph/dashboards/folder/new'),
      import: menuOption('Import', '/graph/dashboard/import'),
    }),
  dashboards: new LeftMenu('Dashboards', '/graph/',
    {
      home: menuOption('Home', '/graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m'),
      manage: menuOption('Manage', '/graph/dashboards'),
      playlists: menuOption('Playlists', '/graph/playlists'),
      snapshots: menuOption('Snapshots', '/graph/dashboard/snapshots'),
    }),
  pmmDashboards: new LeftMenu('PMM dashboards', 'graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m',
    {
      queryAnalytics: menuOption('Query Analytics', '/graph/d/pmm-qan/pmm-query-analytics'),
      systemNode: new SubMenu('System (Node)', '/graph/d/node-instance-overview/',
        {
          nodeOverview: menuOption('Node Overview', '/graph/d/node-instance-overview/', 2),
          nodeSummary: new SubMenu('Node Summary', '/graph/d/node-instance-summary/',
            {
              cpuUtilizationDetails: menuOption('CPU Utilization', '/graph/d/node-cpu/cpu-utilization-details', 3),
              disk: menuOption('Disk', '/graph/d/node-disk/disk-details', 3),
              memory: menuOption('Memory', '/graph/d/node-memory/memory-details', 3),
              network: menuOption('Network', '/graph/d/node-network/network-details', 3),
              temperature: menuOption('Temperature', '/graph/d/node-temp/node-temperature-details', 3),
              numa: menuOption('NUMA', '/graph/d/node-memory-numa/numa-details', 3),
              processes: menuOption('Processes', '/graph/d/node-cpu-process/processes-details', 3),
            }),
        }),
      mySql: new SubMenu('MySQL', '/graph/d/mysql-instance-overview/mysql-instances-overview',
        {
          ha_HighAvailability: new SubMenu('HA (High availability)', '#',
            {
              mySqlGroupReplicationSummary: menuOption('MySQL Group Replication Summary', '/graph/d/mysql-group-replicaset-summary/mysql-group-replication-summary', 3),
              mySQLReplicationSummary: menuOption('MySQL Replication Summary', '/graph/d/mysql-replicaset-summary/mysql-replication-summary', 3),
              pxc_galeraClusterSummary: menuOption('PXC/Galera Cluster Summary', '/graph/d/pxc-cluster-summary/pxc-galera-cluster-summary', 3),
              pxc_galeraNodeSummary: menuOption('PXC/Galera Node Summary', '/graph/d/pxc-node-summary/pxc-galera-node-summary', 3),
              pxc_galeraNodesCompare: menuOption('PXC/Galera Nodes Compare', '/graph/d/pxc-nodes-compare/pxc-galera-nodes-compare', 3),
            }),
          mySqlOverview: menuOption('MySQL Overview', '/graph/d/mysql-instance-overview/mysql-instances-overview', 2),
          mySqlSummary: new SubMenu('MySQL Summary', '/graph/d/mysql-instance-summary/mysql-instance-summary',
            {
              MySqlCommand_HandlerCountersCompare: menuOption('MySQL Command/Handler Counters Compare', '/graph/d/mysql-commandhandler-compare/mysql-command-handler-counters-compare', 3),
              mySqlInnoDbCompressionDetails: menuOption('MySQL InnoDB Compression Details', '/graph/d/mysql-innodb-compression/mysql-innodb-compression-details', 3),
              mySqlInnoDbDetails: menuOption('MySQL InnoDB Details', '/graph/d/mysql-innodb/mysql-innodb-details', 3),
              mySqlPerformanceSchemaDetails: menuOption('MySQL Performance Schema Details', '/graph/d/mysql-performance-schema/mysql-performance-schema-details', 3),
              mySqlQueryResponseTimeDetails: menuOption('MySQL Query Response Time Details', '/graph/d/mysql-queryresponsetime/mysql-query-response-time-details', 3),
              mySqlTableDetails: menuOption('MySQL Table Details', '/graph/d/mysql-table/mysql-table-details', 3),
              mySqlTokuDbDetails: menuOption('MySQL TokuDB Details', '/graph/d/mysql-tokudb/mysql-tokudb-details', 3),
              mySqlUserDetails: menuOption('MySQL User Details', '/graph/d/mysql-user/mysql-user-details', 3),
              mySqlWaitEventAnalysesDetails: menuOption('MySQL Wait Event Analyses Details', '/graph/d/mysql-waitevents-analysis/mysql-wait-event-analyses-details', 3),
              mySqlMyIsam_AriaDetails: menuOption('MySQL MyISAM/Aria Details', '/graph/d/mysql-myisamaria/mysql-myisam-aria-details', 3),
              mySqlMyRocksDetails: menuOption('MySQL MyRocks Details', '/graph/d/mysql-myrocks/mysql-myrocks-details', 3),
              mySqlAmazonAuroraDetails: menuOption('MySQL Amazon Aurora Details', '/graph/d/mysql-amazonaurora/mysql-amazon-aurora-details', 3),
            }),
        }),
      mongoDb: new SubMenu('MongoDB', '/graph/d/mongodb-instance-overview/mongodb-instances-overview',
        {
          ha_HighAvailability: new SubMenu('HA (High availability)', '#',
            {
              mongoDbClusterSummary: menuOption('MongoDB Cluster Summary', '/graph/d/mongodb-cluster-summary/mongodb-cluster-summary', 3),
              mongoDbReplSetSummary: menuOption('MongoDB ReplSet Summary', '/graph/d/mongodb-replicaset-summary/mongodb-replset-summary', 3),
            }),
          mongoDbInstanceOverview: menuOption('MongoDB Overview', '/graph/d/mongodb-instance-overview/mongodb-instances-overview', 2),
          mongoDbInstanceSummary: new SubMenu('MongoDB Summary', '/graph/d/mongodb-instance-summary/mongodb-instance-summary',
            {
              mongoDbInMemoryDetails: menuOption('MongoDB InMemory Details', '/graph/d/mongodb-inmemory/mongodb-inmemory-details', 3),
              mongoDbMmaPv1Details: menuOption('MongoDB MMAPv1', '/graph/d/mongodb-mmapv1/mongodb-mmapv1-details', 3),
              mongoDbWiredTigerDetails: menuOption('MongoDB WiredTiger Details', '/graph/d/mongodb-wiredtiger/mongodb-wiredtiger-details', 3),
            }),
        }),
      postgreSql: new SubMenu('PostgreSQL', '/graph/d/postgresql-instance-overview/postgresql-instances-overview',
        {
          postgreSqlOverview: menuOption('PostgreSQL Overview', '/graph/d/postgresql-instance-overview/postgresql-instances-overview', 2),
          postgreSqlSummary: menuOption('PostgreSQL Summary', '/graph/d/postgresql-instance-summary/postgresql-instance-summary', 2),
        }),
      proxySql: menuOption('ProxySQL', '/graph/d/proxysql-instance-summary/proxysql-instance-summary'),
      haProxy: menuOption('HAProxy', '/graph/d/haproxy-instance-summary/haproxy-instance-summary'),
    }),
  explore: new LeftMenu('Explore', '/graph/explore'),
  alerting: new LeftMenu('Alerting', '/graph/alerting/list',
    {
      alertRules: menuOption('Alert Rules', '/graph/alerting/list'),
      notificationChannels: menuOption('Notification channels', '/graph/alerting/notifications'),

    }),
  configuration: new LeftMenu('Configuration', '/graph/inventory',
    {
      pmmInventory: new SubMenu('PMM Inventory', '/graph/inventory/services',
        {
          inventoryList: menuOption('Inventory list', '/graph/inventory/services', 2),
          addInstance: menuOption('Add instance', '/graph/add-instance', 2),
        }),
      settings: menuOption('Settings', '/graph/settings/metrics-resolution'),
      dataSources: menuOption('Data Sources', '/graph/datasources'),
      users: menuOption('Users', '/graph/org/users'),
      teams: menuOption('Teams', '/graph/org/teams'),
      plugins: menuOption('Plugins', '/graph/plugins'),
      preferences: menuOption('Preferences', '/graph/org'),
      apiKeys: menuOption('API Keys', '/graph/org/apikeys'),
    }),
  serverAdmin: new LeftMenu('Server Admin', '/graph/admin/users',
    {
      users: duplicatedOption('Server Admin', 'Users', '/graph/admin/users'),
      orgs: menuOption('Orgs', '/graph/admin/orgs'),
      settings: duplicatedOption('Server Admin', 'Settings', '/graph/admin/settings'),
      stats: menuOption('Stats', '/graph/admin/stats'),
    }),
};
