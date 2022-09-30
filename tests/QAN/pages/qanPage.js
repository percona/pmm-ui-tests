const {
  I, qanFilters, qanOverview, adminPage,
} = inject();

module.exports = {
  url: 'graph/d/pmm-qan/pmm-query-analytics?from=now-5m&to=now',
  refreshRateFiveSecondsUrl: 'graph/d/pmm-qan/pmm-query-analytics?from=now-5m&to=now&refresh=5s',
  clearUrl: 'graph/d/pmm-qan/pmm-query-analytics',

  fields: {
    qanTitle: locate('$"data-testid Panel header PMM Query Analytics"').as('QAN dashboard title'),
    breadcrumbs: {
      folder: locate('.page-toolbar').find('[aria-label="Search links"] > a').as('Folder name'),
      dashboardName: locate('.page-toolbar').find('[aria-label="Search dashboard by name"]').as('Dashboard name'),
    },
    topMenu: {
      queryAnalytics: '//div[a/span[text()="Query Analytics"]]',
    },
  },
  elements: {
    qanContainer: '.query-analytics-data',
    qanRow: 'div[role="row"]',
    noQueryAvailable: locate('h1').withText('No queries available for this combination of filters in the selected time frame'),
  },

  waitForOpened() {
    I.waitForElement(this.fields.qanTitle, 5);
  },

  async verifyServicePresentInQAN(serviceName) {
    qanOverview.waitForOverviewLoaded();
    qanFilters.waitForFiltersToLoad();
    await I.asyncWaitFor(async () => {
      I.click(adminPage.topMenu.refresh);

      return await qanFilters.isServiceNameOnPage(serviceName);
    }, 300);
  },
};
