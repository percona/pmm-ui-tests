class MongodbReplicaSetSummaryDashboard {
  constructor() {
    this.url = 'graph/d/mongodb-replicaset-summary/mongodb-replset-summary?orgId=1&refresh=1m&from=now-5m&to=now';
    this.cleanUrl = 'graph/d/mongodb-replicaset-summary/mongodb-replset-summary';
    this.metrics = [
      'State',
      'CPU Usage',
      'Memory Used',
      'Disk IO Utilization',
      'Disk Space Utilization',
      'Disk IOPS',
      'Network Traffic',
      'Uptime',
      'Version',
      'Node States',
      'Command Operations',
      'Top Hottest Collections by Read',
      'Query execution times',
      'Top Hottest Collections by Write',
      'Query Efficiency',
      'Queued Operations',
      'Reads & Writes',
      'Connections',
      'Size of Collections',
      'Number of Collections',
      'Replication Lag',
      'Oplog Recovery Window',
      'Flow Control',
      'WiredTiger Concurrency Tickets Available',
      'Nodes Overview',
      'CPU Usage',
      'CPU Saturation and Max Core Usage',
      'Disk I/O and Swap Activity',
      'Network Traffic',
    ];
  }
}

module.exports = new MongodbReplicaSetSummaryDashboard();
module.exports.QueryAnalyticsPage = MongodbReplicaSetSummaryDashboard;
