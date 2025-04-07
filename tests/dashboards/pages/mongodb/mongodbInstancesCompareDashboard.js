const { BaseDashboard } = require('../baseDashboard');

class MongodbInstancesCompareDashboard extends BaseDashboard {
  constructor() {
    super();
    this.url = 'graph/d/mongodb-instance-compare/mongodb-instances-compare';
    this.metrics = (serviceNames) => this.#getMetrics(serviceNames);
    this.failingMetrics = (serviceNames) => this.#getFailingMetrics(serviceNames);
  }

  #getMetrics(serviceNames) {
    const responseMetrics = [];
    const metrics = [
      'Service Info',
      'MongoDB Uptime',
      'Current QPS',
      'DB Connections',
      'Latency',
      'Opened Cursors',
      'Replica Set',
      'ReplSet State',
      'Connections',
      'Cursors',
      'Latency',
      'Scan Ratios',
      'Index Filtering Effectiveness',
      'Requests',
      'Document Operations',
      'Queued Operations',
      'Used Memory',
    ];

    for (const serviceName of serviceNames) {
      for (const metricName of metrics) {
        responseMetrics.push(`${serviceName} - ${metricName}`);
      }
    }

    return responseMetrics;
  }

  #getFailingMetrics(serviceNames) {
    const responseMetrics = [];
    const metrics = [
      'Scan Ratios',
    ];

    for (const serviceName of serviceNames) {
      for (const metricName of metrics) {
        responseMetrics.push(`${serviceName} - ${metricName}`);
      }
    }

    return responseMetrics;
  }

  async verifyDashboardHaveData(serviceName) {
    await super.verifyData(this.metrics(serviceName), this.failingMetrics(serviceName));
  }
}

module.exports = new MongodbInstancesCompareDashboard();
module.exports.MongodbInstancesCompareDashboard = MongodbInstancesCompareDashboard;
