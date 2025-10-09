class MongodbInstancesCompareDashboard {
  constructor() {
    this.url = 'graph/d/mongodb-instance-compare/mongodb-instances-compare';
    this.metrics = [
      'Service Info',
      'MongoDB Uptime',
      'Current QPS',
      'DB Connections',
      'Latency',
      'Opened Cursors',
      'Replica Set',
      'ReplSet State',
      'Connections',
      'Cursors ',
      'Latency',
      'Scan Ratios',
      'Index Filtering Effectiveness',
      'Requests',
      'Document Operations',
      'Queued Operations',
      'Used Memory',
    ];
  }
}

module.exports = new MongodbInstancesCompareDashboard();
module.exports.MongodbInstancesCompareDashboard = MongodbInstancesCompareDashboard;
