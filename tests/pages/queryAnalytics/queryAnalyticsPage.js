const { I } = inject();
const { BasePmmPage } = require('../basePmmPage');
const { QueryAnalyticsFilters } = require('./queryAnalyticsFilters');

class QueryAnalyticsPage extends BasePmmPage {
  constructor() {
    super();
    this.filters = new QueryAnalyticsFilters();
    this.elements = {
      spinner: locate('//div[@data-testid="Spinner"]'),
    };
  }

  async waitForLoaded() {
    await I.waitForDetached(this.elements.spinner, 60);
  }
}

module.exports = new QueryAnalyticsPage();
module.exports.QueryAnalyticsPage = QueryAnalyticsPage;
