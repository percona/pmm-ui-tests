const { I } = inject();

class PostgresqlInstanceOverviewDashboard {
  constructor() {
    this.url = 'graph/d/postgresql-instance-overview/postgresql-instances-overview';
    this.metrics = [
      'Databases Monitored',
      'Executed Queries',
      'Slow Queries',
      'Execution time',
      'Transactions per second',
      'Lowest Uptime (top 3)',
      'Queries',
    ];
    this.elements = {
      slowQueriesText: locate('//section[contains(@data-testid, "Panel header Slow Queries")]//div[@data-testid="TextPanel-converted-content"]'),
      slowQueriesValue: locate('//section[contains(@data-testid, "Panel header Slow Queries")]//div[@data-testid="TextPanel-converted-content"]//span'),
    };
  }

  async verifySlowQueriesPanel(timeFrame) {
    I.waitForVisible(this.elements.slowQueriesText);
    const queryCount = await I.grabTextFrom(this.elements.slowQueriesValue);
    const queryText = await I.grabTextFrom(this.elements.slowQueriesText);

    if (parseInt(queryCount, 10) === 0) {
      throw new Error('Count of Slow Queries should be greater than 0');
    }

    if (!queryText.includes(timeFrame)) {
      throw new Error(`Slow queries text (${queryText.replace('\n', '').trim()}) should contains expected time frame: ${timeFrame}`);
    }
  }
}

module.exports = new PostgresqlInstanceOverviewDashboard();
module.exports.PostgresqlInstanceOverviewDashboard = PostgresqlInstanceOverviewDashboard;
