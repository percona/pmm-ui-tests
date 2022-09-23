const { I, adminPage } = inject();
const assert = require('assert');

const formatElementId = (text) => text.toLowerCase().replace(/ /g, '_');

module.exports = {
  // insert your locators and methods here
  // setting locators
  serviceNameDropdown:
    '//button[@id="var-service_name"]',
  serviceName:
    '//button[@id="var-service_name"]/span',
  serviceNameInput:
    '//input[@aria-controls="options-service_name"]',
  toggleAllValues:
    '//a[@aria-label="Toggle all values"]',
  nodesCompareDashboard: {
    url: 'graph/d/node-instance-compare/nodes-compare?orgId=1&refresh=1m&from=now-5m&to=now',
    metrics: [
      'System Info',
      'System Uptime',
      'CPU Cores',
      'RAM',
      'Saturation Metrics',
      'Load Average',
      'CPU Usage',
      'Interrupts',
      'Context Switches',
      'Memory Usage',
      'Swap Usage',
      'Swap Activity',
      'Mountpoint Usage',
      'Free Space',
      'Disk Operations',
      'Disk Bandwidth',
      'Disk IO Utilization',
      'Disk Latency',
      'Disk Load',
      'Network Traffic',
      'Network Utilization Hourly',
      'Load Average',
      'I/O Activity',
    ],
  },
  advancedDataExplorationDashboard: {
    url:
      'graph/d/prometheus-advanced/advanced-data-exploration?orgId=1&refresh=1m&var-metric=go_gc_duration_seconds',
    metrics: [
      'View Actual Metric Values (Gauge)',
      'View Metric Rate of Change (Counter)',
      'Metric Rates',
      'Metric Data Table',
    ],
  },
  prometheusDashboard: {
    url: 'graph/d/prometheus/prometheus',
    metrics: [
      'Prometheus Process CPU Usage',
      'Prometheus Process Memory Usage',
      'Disk Space Utilization',
      'Time before run out of space',
      'Avg Chunk Time',
      'Samples Per Chunk',
      'Avg Chunk Size',
      'Bytes/Sample',
      'Head Block Size',
      'Avg Compaction Time',
      'WAL Fsync Time',
      'Head GC Latency',
      'Active Data Blocks',
      'Head Block',
      'Chunk Activity',
      'Reload block data from disk',
      'Compactions',
      'Ingestion',
      'Prometheus Targets',
      'Scraped Target by Job',
      'Scrape Time by Job',
      'Scraped Target by Instance',
      'Scrape Time by Instance',
      'Scrapes by Target Frequency',
      'Scrape Frequency Versus Target',
      'Scraping Time Drift',
      'Prometheus Scrape Interval Variance',
      'Slowest Job',
      'Largest Samples Job',
      'Prometheus Queries',
      'Prometheus Query Execution',
      'Prometheus Query Execution Latency',
      'Prometheus Query Execution Load',
      'HTTP Requests duration by Handler',
      'HTTP Response Average Size by Handler',
      'Top 10 metrics by time series count',
      'Top 10 hosts by time series count',
      'CPU Busy',
      'Mem Avail',
      'Disk Reads',
      'Disk Writes',
      'Network IO',
      'Sys Uptime',
    ],
  },
  prometheusExporterStatusDashboard: {
    url: 'graph/d/prometheus-status/prometheus-exporter-status?orgId=1&refresh=1m&from=now-5m&to=now',
    metrics: [
      'CPU Usage',
      'Memory Usage',
      'File Descriptors Used',
      'Exporter Uptime',
      'Collector Scrape Successful',
      'Collector Execution Time (Log Scale)',
      'Collector Execution Time',
      'MySQL Exporter Errors',
      'Rate of Scrapes',
      'MySQL up',
      'MongoDB Scrape Performance',
      'MongoDB Exporter Errors',
      'MongoDB up',
      'ProxySQL Scrape Performance',
      'ProxySQL Exporter Errors',
      'ProxySQL up',
      'Scrape Durations',
    ],
  },
  processDetailsDashboard: {
    url: 'graph/d/node-cpu-process/processes-details?from=now-45m&to=now',
  },
  nodeSummaryDashboard: {
    url: 'graph/d/node-instance-summary/node-summary',
    metrics: [
      'System Uptime',
      'System Summary',
      'Virtual CPUs',
      'Load Average',
      'RAM',
      'Memory Available',
      'CPU Usage',
      'CPU Saturation and Max Core Usage',
      'Interrupts and Context Switches',
      'Processes',
      'Memory Utilization',
      'Virtual Memory Utilization',
      'Swap Space',
      'Swap Activity',
      'I/O Activity',
      'Global File Descriptors Usage',
      'Disk IO Latency',
      'Disk IO Load',
      'Network Traffic',
      'Local Network Errors',
      'TCP Retransmission',
    ],
    ptSummaryDetail: {
      reportContainer: '//pre',
      ptHeaderText: '# Percona Toolkit System Summary Report ######################',
      remoteNodeText: 'No pmm-agent running on this node',
    },
  },
  prometheusExporterOverviewDashboard: {
    url: 'graph/d/prometheus-overview/prometheus-exporters-overview?orgId=1&refresh=1m&from=now-5m&to=now',
    metrics: [
      'Avg CPU Usage per Node',
      'Avg Memory Usage per Node',
      'Monitored Nodes',
      'Exporters Running',
      'CPU Usage',
      'Memory Usage',
      'CPU Cores Used',
      'CPU Used',
      'Mem Used',
      'Virtual CPUs',
      'RAM',
      'File Descriptors Used',
    ],
  },
  sharePanel: {
    elements: {
      imageRendererPluginInfoText: locate('p').withDescendant('.external-link'),
      imageRendererPluginLink: locate('[role="alert"]').find('.external-link'),
    },
    messages: {
      imageRendererPlugin: 'To render a panel image, you must install the Image Renderer plugin. Please contact your PMM administrator to install the plugin.',
    },
  },
  proxysqlInstanceSummaryDashboard: {
    url: 'graph/d/proxysql-instance-summary/proxysql-instance-summary',
    metrics: [
      'Hostgroup Size',
      'Client Connections',
      'Client Questions',
      'Active Backend Connections',
      'Failed Backend Connections',
      'Active Frontend Connections',
      'Client Frontend Connections',
      'Endpoint Status',
      'Queries Routed',
      'Query processor time efficecy',
      'Connection Free',
      'Latency',
      'Executed Queries',
      'Queries Execution Time',
      'Queries Latency',
      // instead of 6 metrics, one metric 'Commands Latency All' is visible
      // 'Commands Latency - CREATE_TEMPORARY',//*
      // 'Commands Latency - DELETE',//*
      // 'Commands Latency - INSERT',//*
      // 'Commands Latency - SELECT',//*
      // 'Commands Latency - SELECT_FOR_UPDATE',//*
      // 'Commands Latency - UPDATE',//*
      'Query Cache memory',
      'Query Cache efficiency',
      'Network Traffic',
      'Mirroring efficiency',
      'Memory Utilization',
      'Memory Usage',
      'System Uptime',
      'Load Average',
      'RAM',
      'Memory Available',
      'Virtual Memory',
      'Disk Space',
      'Min Space Available',
      'Node',
      'CPU Usage',
      'CPU Saturation and Max Core Usage',
      'Disk I/O and Swap Activity',
      'Network Traffic',
    ],
  },
  pxcGaleraClusterSummaryDashboard: {
    url: 'graph/d/pxc-cluster-summary/pxc-galera-cluster-summary?orgId=1&',
    metrics: [
      'Percona XtraDB / Galera Cluster Size',
      'Flow Control Paused Time',
      'Flow Control Messages Sent',
      'Writeset Inbound Traffic',
      'Writeset Outbound Traffic',
      'Receive Queue',
      'Send Queue',
      'Transactions Received',
      'Transactions Replicated',
      'Average Incoming Transaction Size',
      'Average Replicated Transaction Size',
      'FC Trigger Low Limit',
      'FC Trigger High Limit',
      'IST Progress',
      'Average Galera Replication Latency',
      'Maximum Galera Replication Latency',
    ],
  },
  postgresqlInstanceSummaryDashboard: {
    url: 'graph/d/postgresql-instance-summary/postgresql-instance-summary?orgId=1&from=now-5m&to=now',
    metrics: [
      'Version',
      'Max Connections',
      'Shared Buffers',
      'Disk-Page Buffers',
      'Memory Size for each Sort',
      'Disk Cache Size',
      'Autovacuum',
      'PostgreSQL Connections',
      'Active Connections',
      'Tuples',
      'Read Tuple Activity',
      'Transactions',
      'Duration of Transactions',
      'Number of Temp Files',
      'Size of Temp Files',
      'Conflicts/Deadlocks',
      'Number of Locks',
      'Operations with Blocks',
      'Buffers',
      'Canceled Queries',
      'Cache Hit Ratio',
      'Checkpoint stats',
      'Number of Locks',
    ],
  },
  postgresqlInstanceCompareDashboard: {
    url: 'graph/d/postgresql-instance-compare/postgresql-instances-compare?orgId=1&from=now-5m&to=now',
    metrics: [
      'Service Info',
      'PostgreSQL Connections',
      'Active Connections',
      'Tuples',
      'Transactions',
    ],
  },
  postgresqlInstanceOverviewDashboard: {
    // had to be changed after the PMM-6386 bug will be fixed
    url: 'graph/d/postgresql-instance-overview/postgresql-instances-overview?orgId=1&from=now-5m&to=now',
    metrics: [
      'Services',
      'Max Active Connections',
      'Total Disk-Page Buffers',
      'Total Memory Size for each Sort',
      'Total Shared Buffers',
      'Services Autovacuum',
      'Top 5 PostgreSQL Connections',
      'Top 5 Active Connections',
      'Idle Connections',
      'Active Connections',
      'Autovacuum',
      'Total Tuples',
      'Max Fetched Tuples',
      'Max Returned Tuples',
      'Max Inserted Tuples',
      'Max Updated Tuples',
      'Max Deleted Tuples',
      'Top 5 Fetched Tuples Rate',
      'Fetched Tuples Rate',
      'Top 5 Returned Tuples Rate',
      'Returned Tuples Rate',
      'Top 5 Inserted Tuples Rate',
      'Inserted Tuples Rate',
      'Top 5 Updated Tuples Rate',
      'Updated Tuples Rate',
      'Top 5 Deleted Tuples Rate',
      'Deleted Tuples Rate',
      'Total Transactions',
      'Max Commits Transactions',
      'Max Rollback Transactions',
      'Max Transaction Duration',
      'Max Number of Temp Files',
      'Max Size of Temp Files',
      'Top 5 Commit Transactions',
      'Commit Transactions',
      'Top 5 Rollbacks Transactions',
      'Rollback Transactions',
      'Top 5 Duration of Active Transactions',
      'Duration of Active Transactions',
      'Top 5 Duration of Other Transactions',
      'Duration of Other Transactions',
      'Top 5 Number of Temp Files',
      'Number of Temp Files',
      'Top 5 Size of Temp Files',
      'Size of Temp Files',
      'Total Locks',
      'Total Deadlocks',
      'Total Conflicts',
      'Min Cache Hit Ratio',
      'Max Cache Hit Ratio',
      'Total Canceled Queries',
      'Top 5 Locks',
      'Locks',
      'Top 5 Deadlocks',
      'Deadlocks',
      'Top 5 Conflicts',
      'Conflicts',
      'Top 5 Lowest Cache Hit Ratio',
      'Cache Hit Ratio',
      'Top 5 Canceled Queries',
      'Canceled Queries',
      'Total Blocks Operations',
      'Max Blocks Writes',
      'Max Blocks Reads',
      'Max Allocated Buffers',
      'Total Written Files to disk',
      'Total Files Synchronization to Disk',
      'Top 5 Read Operations with Blocks',
      'Read Operations with Blocks',
      'Top 5 Write Operations with Blocks',
      'Write Operations with Blocks',
      'Top 5 Allocated Buffers',
      'Allocated Buffers',
      'Top 5 Fsync calls by a backend',
      'Fsync calls by a backend',
      'Top 5 Written directly by a backend',
      'Written directly by a backend',
      'Top 5 Written by the background writer',
      'Written by the background writer',
      'Top 5 Written during checkpoints',
      'Written during checkpoints',
      'Top 5 Files Synchronization to disk',
      'Files Synchronization to disk',
      'Top 5 Written Files to Disk',
      'Written Files to Disk',
    ],
  },
  mongodbOverviewDashboard: {
    url: 'graph/d/mongodb-instance-summary/mongodb-instance-summary',
    metrics: [
      'Node',
      'MongoDB Uptime',
      'QPS',
      'Latency',
      'ReplSet',
      'Current ReplSet State',
      'Command Operations',
      'Latency Detail',
      'Connections',
      'Cursors',
      'Document Operations',
      'Queued Operations',
      'Query Efficiency',
      'Scanned and Moved Objects',
      'getLastError Write Time',
      'getLastError Write Operations',
      'Assert Events',
      'Page Faults',
      'System Uptime',
      'Load Average',
      'RAM',
      'Memory Available',
      'Virtual Memory',
      'Disk Space',
      'Min Space Available',
      'Node',
      'CPU Usage',
      'CPU Saturation and Max Core Usage',
      'Disk I/O and Swap Activity',
      'Network Traffic',
    ],
  },
  mongoDbClusterSummaryDashboard: {
    url: 'graph/d/mongodb-cluster-summary/mongodb-cluster-summary',
    metrics: [
      'Unsharded DBs',
      'Sharded DBs',
      'Sharded Collections',
      'Shards',
      'Chunks',
      'Balancer Enabled',
      'Chunks Balanced',
      'Mongos Cursors',
      'Change Log Events',
      'Operations Per Shard',
      'Current Connections Per Shard',
      'Cursors Per Shard',
      'Replication Lag by Set',
      'Oplog Range by Set',
      'Amount of Collections in Shards',
      'Size of Collections in Shards',
      'QPS of Mongos Service',
      'QPS of Services in Shard - All',
      'QPS of Config Services',
      'Amount of Indexes in Shards',
      'Dynamic of Indexes',
      'Total Connections',
      'Current Connections Per Shard',
      'Total Mongos Operations',
    ],
  },
  mongoDbInstanceSummaryDashboard: {
    url: 'graph/d/mongodb-instance-summary/mongodb-instance-summary?orgId=1&refresh=1m&from=now-5m&to=now',
  },
  mysqlInstanceSummaryDashboard: {
    url: 'graph/d/mysql-instance-summary/mysql-instance-summary?orgId=1&refresh=1m&from=now-5m&to=now',
    clearUrl: 'graph/d/mysql-instance-summary/mysql-instance-summary',
    metrics: [
      'Node',
      'MySQL Uptime',
      'Version',
      'Current QPS',
      'InnoDB Buffer Pool Size',
      'Buffer Pool Size of Total RAM',
      'Service Summary',
      'MySQL Connections',
      'MySQL Aborted Connections',
      'MySQL Client Thread Activity',
      'MySQL Thread Cache',
      'MySQL Temporary Objects',
      'MySQL Slow Queries',
      'MySQL Select Types',
      'MySQL Sorts',
      'MySQL Table Locks',
      'MySQL Questions',
      'MySQL Network Traffic',
      'MySQL Network Usage Hourly',
      'MySQL Internal Memory Overview',
      'Top Command Counters',
      'Top Command Counters Hourly',
      'MySQL Handlers',
      'MySQL Transaction Handlers',
      'Process States',
      'Top Process States Hourly',
      'MySQL Query Cache Memory',
      'MySQL Query Cache Activity',
      'MySQL File Openings',
      'MySQL Open Files',
      'MySQL Table Open Cache Status',
      'MySQL Open Tables',
      'MySQL Table Definition Cache',
    ],
  },
  mysqlUserDetailsDashboard: {
    url: 'graph/d/mysql-user/mysql-user-details?orgId=1&refresh=1m&from=now-5m&to=now',
    clearUrl: 'graph/d/mysql-user/mysql-user-details',
    metrics: [
      'Active Users',
      'Lost Connections',
      'Denied Connections',
      'Access Denied',
      'Users Activity',
      'Users by Connections Created',
      'Users by Concurrent Connections',
      'Users by Lost Connections',
      'Top Users by Denied Connections',
      'Users by Busy Load',
      'Users by CPU Time',
      'Users by Traffic',
      'Users by Bytes Written to The Binary Log',
      'Rows Fetched/Read',
      'Rows Updated',
      'Users by Rows Fetched/Read',
      'Users by Rows Updated',
      'Users by Rollback Transactions',
      'Users by Commit Transactions',
      'Users by Update Commands',
      'Users by Select Commands',
      'Users by Other Commands',
      'Users by Access Denied',
      'Users by Empty Queries',
      'MySQL Uptime',
      'Version',
      'Current QPS',
      'File Handlers Used',
      'Table Open Cache Miss Ratio',
      'Table Open Cache Size',
      'Table Definition Cache Size',
      'Service',
      'MySQL Connections',
      'MySQL Client Thread Activity',
      'MySQL Handlers',
      'Top Command Counters',
      'Process States',
      'MySQL Network Traffic',
      'System Uptime',
      'Load Average',
      'RAM',
      'Memory Available',
      'Virtual Memory',
      'Disk Space',
      'Min Space Available',
      'Node',
      'CPU Usage',
      'CPU Saturation and Max Core Usage',
      'Disk I/O and Swap Activity',
      'Network Traffic',
    ],
  },
  mongoDbInstanceOverview: {
    url: 'graph/d/mongodb-instance-overview/mongodb-instances-overview?orgId=1&refresh=1m',
  },
  homeDashboard: {
    metrics: [
      'CPU Busy',
      'Mem Avail',
      'Disk Reads',
      'Disk Writes',
      'Network IO',
      'DB Conns',
      'DB QPS',
      'Virtual CPUs',
      'RAM',
      'Host uptime',
      'DB uptime',
    ],
  },
  mySQLInstanceOverview: {
    url: 'graph/d/mysql-instance-overview/mysql-instances-overview?orgId=1&from=now-2m&to=now&refresh=1m',
    clearUrl: 'graph/d/mysql-instance-overview/mysql-instances-overview',
    metrics: [
      'Services',
      'Min MySQL Uptime',
      'Max MySQL Uptime',
      'Total Current QPS',
      'Total InnoDB Buffer Pool Size',
      'Top MySQL Used Connections',
      'Top MySQL Client Threads Connected',
      'Top MySQL Active Client Threads',
      'Top MySQL Threads Cached',
      'Top 5 MySQL Used Connections',
      'MySQL Used Connections',
      'Top 5 MySQL Aborted Connections',
      'Aborted Connections',
      'Top 5 MySQL Client Threads Connected',
      'MySQL Client Threads Connected',
      'Top 5 MySQL Active Client Threads',
      'MySQL Idle Client Threads',
      'Top 5 MySQL Thread Cached',
      'Percentage of Cached MySQL Threads',
      'Top MySQL Queries',
      'Top MySQL Questions',
      'Top InnoDB I/O Data Reads',
      'Top InnoDB I/O Data Writes',
      'Top Data Fsyncs',
      'Top 5 MySQL Queries',
      'MySQL QPS',
      'Top 5 MySQL Questions',
      'MySQL Questions in Queries',
      'Top 5 Data Reads',
      'Percentage of Data Read',
      'Top 5 Data Writes',
      'Percentage of Data Writes',
      'Top 5 Data Fsyncs',
      'Percentage of Data Fsyncs',
      'Top MySQL Questions',
      'Top MySQL Selects',
      'Top MySQL Sorts',
      'Top MySQL Aborted Connections',
      'Top MySQL Table Locks',
      'MySQL Temporary Objects',
      'Top 5 MySQL Selects',
      'MySQL Selects',
      'Top 5 MySQL Sorts',
      'MySQL Sorts',
      'Top 5 MySQL Table Locks',
      'MySQL Table Locks',
      'Top MySQL Incoming Network Traffic',
      'Top MySQL Outgoing Network Traffic',
      'Top MySQL Used Query Cache',
      'Top Percentage of File Openings to Opened Files',
      'Top Percentage of Opened Files to the Limit',
      'Top 5 MySQL Incoming Network Traffic',
      'Top 5 MySQL Outgoing Network Traffic',
      'MySQL Query Cache Size',
      'MySQL Used Query Cache',
      'Top 5 MySQL File Openings',
      'Percentage of File Openings to Opened Files',
      'Top 5 MySQL Opened Files',
      'Percentage of Opened Files to the Limit',
      'Top Open Cache Miss Ratio',
      'Min MySQL Opened Table Definitions',
      'Top MySQL Opened Table Definitions',
      'Top MySQL Open Table Definitions',
      'Top Open Table Definitions to Definition Cache',
      'Lowest 5 Open Cache Hit Ratio',
      'Open Cache Miss Ratio',
      'MySQL Table Definition Cache',
      'Top 5 MySQL Opened Table Definitions',
      'Top 5 MySQL Open Table Definitions',
      'Percentage of Open Table Definitions to Table Definition Cache',
    ],
    urlWithRDSFilter:
      'graph/d/mysql-instance-overview/mysql-instances-overview?orgId=1&'
      + 'from=now-5m&to=now&refresh=1m&var-interval=$__auto_interval_interval&var-region=All&'
      + 'var-environment=All&var-cluster=rds56-cluster&var-replication_set=All&var-az=&'
      + 'var-node_type=All&var-node_model=&var-database=All&var-service_type=All&var-schema=All',
  },
  mysqlInstancesCompareDashboard: {
    url: 'graph/d/mysql-instance-compare/mysql-instances-compare?orgId=1&refresh=1m&from=now-5m&to=now',
    clearUrl: 'graph/d/mysql-instance-compare/mysql-instances-compare',
    metrics: [
      'Service Info',
      'MySQL Uptime',
      'Current QPS',
      'DB Connections',
      'InnoDB Buffer Pool Size',
      'Buffer Pool Size of Total RAM',
      'MySQL Connections',
      'MySQL Aborted Connections',
      'MySQL Questions',
      'MySQL Client Thread Activity',
      'MySQL Thread Cache',
      'MySQL Temporary Objects',
      'MySQL Select Types',
      'MySQL Slow Queries',
      'MySQL Sorts',
      'MySQL Table Locks',
      'MySQL Network Traffic',
      'MySQL Network Usage Hourly',
      'MySQL Internal Memory Overview',
      'Top Command Counters',
      'Top Command Counters Hourly',
      'MySQL Handlers',
      'MySQL Transaction Handlers',
      'Process States',
      'Top 5 Process States Hourly',
      'MySQL Query Cache Memory',
      'MySQL Query Cache Activity',
      'MySQL File Openings',
      'MySQL Open Files',
      'MySQL Table Open Cache Status',
      'MySQL Open Tables',
      'MySQL Table Definition Cache',
    ],
  },
  groupReplicationDashboard: {
    url: 'graph/d/mysql-group-replicaset-summary/mysql-group-replication-summary?orgId=1&refresh=1m',
    clearUrl: 'graph/d/mysql-group-replicaset-summary/mysql-group-replication-summary',
    metrics: [
      'Group Replication Service States',
      'PRIMARY Service',
      'Replication Group Members',
      'Replication Lag',
      'Transport Time',
      'Replication Delay',
      'Transaction Apply Time',
      'Transaction Time Inside the Local Queue',
      'Checked Transactions',
      'Transactions Row Validating',
      'Applied Transactions',
      'Sent Transactions',
      'Received Transactions Queue',
      'Rolled Back Transactions',
      'Transactions in the Queue for Checking',
      'Detected Conflicts',
    ],
  },
  mysqlPXCGaleraNodeSummaryDashboard: {
    url: 'graph/d/pxc-node-summary/pxc-galera-node-summary?orgId=1&refresh=1m',
    clearUrl: 'graph/d/pxc-node-summary/pxc-galera-node-summary',
    metrics: [
      'Ready to Accept Queries',
      'Local State',
      'Desync Mode',
      'Cluster Status',
      'gcache Size',
      'FC (normal traffic)',
      'Galera Replication Latency',
      'Galera Replication Queues',
      'Galera Cluster Size',
      'Galera Flow Control',
      'Galera Parallelization Efficiency',
      'Galera Writing Conflicts',
      'Available Downtime before SST Required',
      'Galera Writeset Count',
      'Galera Writeset Size',
      'Galera Writeset Traffic',
      'Galera Network Usage Hourly',
    ],
  },
  mysqlPXCGaleraNodesCompareDashboard: {
    url: 'graph/d/pxc-nodes-compare/pxc-galera-nodes-compare?orgId=1&refresh=1m',
    clearUrl: 'graph/d/pxc-nodes-compare/pxc-galera-nodes-compare',
    metrics: [
      'Ready to Accept Queries',
      'Local State',
      'Desync Mode',
      'Cluster Status',
      'gcache Size',
      'FC (normal traffic)',
    ],
    tabs: [
      'Galera Replication Latency',
      'Galera Replication Queues',
      'Galera Flow Control',
      'Galera Writing Conflicts',
      'Galera Writeset Count',
      'Galera Writeset Traffic',
      'Galera Parallelization Efficiency',
      'Available Downtime before SST Required',
      'Galera Writeset Size',
      'Galera Network Usage Hourly',
    ],
  },
  victoriaMetricsDashboard: {
    url: 'graph/d/victoriametrics/victoriametrics?orgId=1',
    metrics: [
      'Uptime',
      'Version',
      'CPU Usage',
      'Memory Usage',
      'Disk Usage',
      'Total Datapoints',
      'Index Size',
      'Concurrent Inserts',
      'Cache Memory Usage',
      'Time before run out of space',
      'Requests',
      'Active Time Series Changes',
      'Queries Duration',
      'Queries Duration Details',
      'Cache Memory Usage',
      'Cache Size',
      'Concurrent Inserts',
      'Error Requests',
      'Disk Space Usage - Datapoints',
      'Disk Space Usage - Index',
      'Datapoints Ingestions',
      'Pending Datapoints',
      'Datapoints',
      'LSM Parts',
      'Active Merges',
      'Merge speed',
      'TCP Connections',
      'Ignored Rows',
      'Logging Messages',
      'Churn Rate',
      'Slow Queries',
      'Slow Inserts',
      'Memory Usage',
      'Time Series',
      'Top 10 metrics by time series count',
      'Top 10 hosts by time series count',
      'Flags',
      'CPU Busy',
      'Mem Avail',
      'Disk Reads',
      'Disk Writes',
      'Network IO',
      'Sys Uptime',
    ],
  },
  victoriaMetricsAgentsOverviewDashboard: {
    url: 'graph/d/vmagent/victoriametrics-agents-overview?orgId=1&refresh=1m',
    metrics: [
      'Current Uptime',
      'Scraped Targets UP',
      'Scraped Samples',
      'Dropped Samples',
      'Logged Errors',
      'Uptime',
      'Scraped Samples',
      'Remotely  Written Samples',
      'Dropped Samples (Persistent Queue)',
      'Persistent Queue Size',
      'Dropped Samples (Relabeling)',
      'HTTP Requests',
      'Logged Errors/Warnings',
      'HTTP Requests Details',
      'HTTP Errors',
      'Scrapes',
      'Samples',
      'Scrapes p0.95 Response Size',
      'Timeout Scrapes',
      'Failed Scrapes',
      'Dial Errors',
      'Gunzip Failed Scrapes',
      'Scrapes Duration',
      'Write Requests',
      'Write Errors',
      'Parsed Rows',
      'Dropped Invalid Rows',
      'Remote Write Requests',
      'Remote Write Size',
      'Block Size Rows',
      'Block Size in Bytes',
      'Requests Retry Rate',
      'Established Connections',
      'Remote Write Duration',
      'CPU Usage',
      'Memory Usage',
      'Threads',
      'Network  Usage',
    ],
  },

  mysqlAmazonAuroraDetails: {
    url: 'graph/d/mysql-amazonaurora/mysql-amazon-aurora-details?orgId=1&refresh=1m',
    metrics: [
      'Amazon Aurora Transaction Commits',
      'Amazon Aurora Load',
      'Aurora Memory Used',
      'Amazon Aurora Statement Latency',
      'Amazon Aurora Special Command Counters',
      'Amazon Aurora Problems',
    ],
  },

  mongoDbCollectionDetails: {
    url: 'graph/d/mongodb-collection-details/mongodb-collection-details?orgId=1&refresh=1m',
    metrics: [
      'Top 10 Largest Collections by Document Count',
      'Top 10 Largest Collections by Size',
      'Total Databases Size',
      'Top 5 Most Fragmented Collections by Freeable Size',
      'Top 5 Collections by Documents Read',
      'Top 5 Collections by Documents Changed',
    ],
  },
  mongoDbCollectionsOverview: {
    url: 'graph/d/mongodb-collections-overview/mongodb-collections-overview?orgId=1&refresh=1m',
    metrics: [
      'Top 5 Databases By Size',
      'Collections in Database',
      'Indexes in Database',
      'Avg Object Size in Database',
      'Index Size in Database',
      'Data Size for Database',
      'Top 5 Hottest Collections by Read  (Total)',
      'Top 5 Hottest Collections by Write (Total)',
      'Top 5 Hottest Collections by Read (Rate)',
      'Top 5 Hottest Collections by Write (Rate)',
      'Collections statistics  from admin (rate)',
      'Collections statistics  from admin (summary)',
      'Collections statistics  admin',
    ],
  },

  mongoDbOplogDetails: {
    url: 'graph/d/mongodb-oplog-details/mongodb-oplog-details?orgId=1&refresh=1m',
    metrics: [
      'Oplog Recovery Window',
      'Oplog Buffered Operations',
      'Oplog Getmore Time',
      'Oplog Processing Time',
      'Oplog Buffer Capacity',
      'Oplog Operations',
      'Oplog B/Hr',
      'Oplog Window',
    ],
  },

  fields: {
    breadcrumbs: {
      folder: locate('.page-toolbar').find('[aria-label="Search links"] > a'),
      dashboardName: locate('.page-toolbar').find('[aria-label="Search dashboard by name"]'),
    },
    annotationMarker: '(//div[contains(@class,"events_marker")])',
    clearSelection: '//a[@ng-click="vm.clearSelections()"]',
    collapsedDashboardRow: '//div[@class="dashboard-row dashboard-row--collapsed"]/a',
    dataLinkForRoot: '//div[contains(text(), "Data links")]/..//a',
    Last2Days: '//span[contains(text(), "Last 2 days")]',
    metricTitle: '//div[@class="panel-title"]',
    mongoDBServiceSummaryContent: locate('pre').withText('Mongo Executable'),
    mySQLServiceSummaryContent: locate('pre').withText('Percona Toolkit MySQL Summary Report'),
    navbarLocator: '.page-toolbar',
    notAvailableDataPoints: '//div[contains(text(),"No data")]',
    notAvailableMetrics: '//span[contains(text(), "N/A")]',
    otherReportTitleWithNoData:
    '//span[contains(text(),"No Data")]//ancestor::div[contains(@class,"panel-container")]//span[contains(@class,"panel-title-text")]',
    panelLoading: locate('div').withAttr({ class: 'panel-loading' }),
    postgreSQLServiceSummaryContent: locate('pre').withText('Detected PostgreSQL version:'),
    reportTitleWithNA:
      locate('.panel-title').inside(locate('.panel-container').withDescendant('//span[contains(text(),"N/A")]')),
    reportTitleWithNoData:
      locate('.panel-title').inside(locate('.panel-container').withDescendant('//div[contains(text(),"No data")]')),
    rootUser: '//div[contains(text(), "root")]',
    serviceSummary: locate('a').withText('Service Summary'),
    // timeRangePickerButton: '.btn.navbar-button.navbar-button--tight',
    timeRangePickerButton: I.useDataQA('data-testid TimePicker Open Button'),
    timeRangeOption: (timeRange) => locate('li').withDescendant('label').withText(timeRange),
    openFiltersDropdownLocator: (filterName) => locate('.variable-link-wrapper').after(`label[for="var-${formatElementId(filterName)}"]`),
    filterDropdownOptionsLocator: (filterName) => locate('.variable-option').withText(filterName),
  },

  createAdvancedDataExplorationURL(metricName, time = '1m', nodeName = 'All') {
    return `graph/d/prometheus-advanced/advanced-data-exploration?orgId=1&refresh=1m&var-metric=${metricName}&var-interval=$__auto_interval_interval&var-node_name=${nodeName}&from=now-${time}&to=now`;
  },

  async checkNavigationBar(text) {
    I.waitForVisible(this.fields.navbarLocator, 30);
    const navbarText = await I.grabTextFrom(this.fields.navbarLocator);

    assert.ok(navbarText.includes(text));
  },

  async getExactFilterValue(filterName) {
    return await I.grabAttributeFrom(`//label[contains(@aria-label, '${filterName}')]/..//a`, 'title');
  },

  annotationLocator(number = 1) {
    return `(//div[contains(@class,"events_marker")])[${number}]`;
  },

  annotationTagText(tagValue) {
    return `//span[contains(text(),  '${tagValue}')]`;
  },

  annotationText(annotationTitle) {
    return `//div[contains(text(), '${annotationTitle}')]`;
  },

  verifyAnnotationsLoaded(title, number = 1) {
    I.waitForElement(this.fields.annotationMarker, 30);
    I.moveCursorTo(this.annotationLocator(number));
    I.waitForVisible(this.annotationText(title), 30);
  },

  // introducing methods
  verifyMetricsExistence(metrics) {
    for (const i in metrics) {
      I.waitForVisible(this.graphsLocator(metrics[i]), 5);
    }
  },

  openGraphDropdownMenu(metric) {
    I.seeElement(this.graphsLocator(metric));
    I.click(this.graphsLocator(metric));
  },

  verifyTabExistence(tabs) {
    for (const i in tabs) {
      I.seeElement(this.tabLocator(tabs[i]));
    }
  },

  graphsLocator(metricName) {
    return locate('.panel-title-container h2').withText(metricName);
  },

  tabLocator(tabName) {
    return `//a[contains(text(), '${tabName}')]`;
  },
  async waitForAllGraphsToHaveData(timeout = 60) {
    await I.waitForInvisible(this.fields.notAvailableMetrics, timeout);
    await I.waitForInvisible(this.fields.notAvailableDataPoints, timeout);
  },

  async verifyThereAreNoGraphsWithNA(acceptableNACount = 0) {
    const numberOfNAElements = await I.grabNumberOfVisibleElements(this.fields.notAvailableMetrics);

    I.say(`number of N/A elements is = ${numberOfNAElements}`);
    if (numberOfNAElements > acceptableNACount) {
      const titles = await this.grabFailedReportTitles(this.fields.reportTitleWithNA);

      const url = await I.grabCurrentUrl();

      await this.printFailedReportNames(acceptableNACount, numberOfNAElements, titles, url);
    }
  },

  async verifyThereAreNoGraphsWithoutData(acceptableNoDataCount = 0) {
    const numberOfNoDataElements = await I.grabNumberOfVisibleElements(this.fields.notAvailableDataPoints);

    I.say(`number of No Data elements is = ${numberOfNoDataElements}`);
    if (numberOfNoDataElements > acceptableNoDataCount) {
      const titles = await this.grabFailedReportTitles(this.fields.reportTitleWithNoData);
      const url = await I.grabCurrentUrl();

      await this.printFailedReportNames(acceptableNoDataCount, numberOfNoDataElements, titles, url);
    }
  },

  async printFailedReportNames(expectedNumber, actualNumber, titles, dashboardUrl) {
    assert.equal(
      actualNumber <= expectedNumber,
      true,
      `Expected ${expectedNumber} Elements without data but found ${actualNumber} on Dashboard ${dashboardUrl}. Report Names are ${titles}`,
    );
  },

  async grabFailedReportTitles(selector) {
    return await I.grabTextFromAll(selector);
  },

  async expandEachDashboardRow(halfToExpand) {
    let sectionsToExpand;
    const sections = await I.grabTextFromAll(this.fields.collapsedDashboardRow);

    if (halfToExpand === 1) {
      sectionsToExpand = sections.slice(0, sections.length / 2);
    } else if (halfToExpand === 2) {
      sectionsToExpand = sections.slice(sections.length / 2, sections.length);
    } else {
      sectionsToExpand = sections;
    }

    await this.expandRows(sectionsToExpand);
  },

  async expandRows(sectionsToExpand) {
    let sections;

    if (typeof sectionsToExpand === 'string') {
      sections = [sectionsToExpand];
    } else {
      sections = sectionsToExpand;
    }

    for (let i = 0; i < sections.length; i++) {
      const sectionName = sections[i].toString().split('(');
      const rowToExpand = `${this.fields.collapsedDashboardRow}[contains(text(), '${sectionName[0]}')]`;

      I.click(rowToExpand);
      I.wait(0.5);
      adminPage.performPageDown(1);
      adminPage.performPageDown(1);
    }
  },

  waitForDashboardOpened() {
    I.waitForElement(this.fields.metricTitle, 60);
  },

  waitForDataLoaded() {
    I.waitForInvisible('//*[@aria-label="Loading indicator"]');
  },

  expandFilters(filterName) {
    const dropdownLocator = this.fields.openFiltersDropdownLocator(filterName);

    // This is due to some instances with many services take filter to load
    I.wait(3);
    I.waitForElement(dropdownLocator, 30);
    I.click(dropdownLocator);

    return '[aria-label="Variable options"]';
  },

  async genericDashboardLoadForDbaaSClusters(url, timeRange = 'Last 5 minutes', performPageDown = 4, graphsWithNa = 0, graphsWithoutData = 0) {
    I.amOnPage(url);
    this.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    await adminPage.applyTimeRange(timeRange);
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(performPageDown);
    await this.expandEachDashboardRow();
    await this.verifyThereAreNoGraphsWithNA(graphsWithNa);
    await this.verifyThereAreNoGraphsWithoutData(graphsWithoutData);
  },

  async applyFilter(filterName, filterValue) {
    const filterValueSelector = `//span[contains(text(), '${filterValue}')]`;
    const filterDropdownOptionsLocator = this.fields.filterDropdownOptionsLocator(filterValue);
    const dropdownLocator = this.fields.openFiltersDropdownLocator(filterName);
    const selectedFilterValue = await I.grabTextFrom(dropdownLocator);

    // If there is only one value for a filter it is selected by default
    if (selectedFilterValue !== 'All' && selectedFilterValue === filterValue) {
      I.seeTextEquals(filterValue, dropdownLocator);
    } else {
      this.expandFilters(filterName);
      I.waitForElement(filterDropdownOptionsLocator, 30);
      I.waitForVisible(filterValueSelector, 30);
      I.click(filterValueSelector);
    }
  },

  async getTimeRange() {
    return await I.grabTextFrom(this.fields.timeRangePickerButton);
  },

  setTimeRange(timeRange = 'Last 5 minutes') {
    I.click(this.fields.timeRangePickerButton);
    I.click(this.fields.timeRangeOption(timeRange));
    this.waitForDataLoaded();
  },

  async waitPTSummaryInformation() {
    const response = await I.waitForResponse(
      (response) => response.url().endsWith('v1/management/Actions/StartPTSummary') && response.status() === 200,
      { timeout: 60 },
    );

    await I.waitForResponse(
      (response) => response.url().endsWith('v1/management/Actions/Get') && response.status() === 200,
      { timeout: 60 },
    );

    return await response.json();
  },

  async waitAndSwitchTabs(ammountOfTabs) {
    for (let i = 0; i <= 10; i++) {
      const numberOfTabs = await I.grabNumberOfTabs();

      if (numberOfTabs === ammountOfTabs) {
        I.switchToNextTab(1);
        break;
      }
    }
  },

  async changeServiceName(serviceName) {
    if (serviceName !== await I.grabTextFrom(this.serviceName)) {
      I.click(this.serviceNameDropdown);
      I.click(this.toggleAllValues);
      I.fillField(this.serviceNameInput, serviceName);
      I.pressKey('Enter');
    }

    this.waitForDataLoaded();
  },
};
