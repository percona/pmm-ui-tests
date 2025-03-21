const { BaseDashboard } = require('./baseDashboard');

class MysqlUserDetailsDashboard extends BaseDashboard {
  constructor() {
    super();
    this.url = 'graph/d/mysql-user/mysql-user-details';
    this.metrics = [
      'Active Users',
      'Lost Connections',
      'Denied Connections',
      'Access Denied',
      'Users Activity',
      'Top 10 Sessions',
      'Users by Connections Created',
      'Users by Concurrent Connections',
      'Users by Lost Connections',
      'Top Users by Denied Connections',
      'Users by Busy Load',
      'Users by CPU Time',
      'Users by Traffic',
      'Users by Bytes Written to The Binary Log',
      'Rows Fetched',
      'Rows Read',
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
    ];
  }

  async verifyDashboardMetricsHaveData() {
    await super.verifyMetricsHaveData(this.metrics);
  }
}

module.exports = new MysqlUserDetailsDashboard();
module.exports.MysqlUserDetailsDashboard = MysqlUserDetailsDashboard;
