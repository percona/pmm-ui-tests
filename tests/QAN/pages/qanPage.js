const { I } = inject();

module.exports = {
  url: 'graph/d/pmm-qan/pmm-query-analytics?from=now-5m&to=now',
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

  waitForOpened() {
    I.waitForElement(this.fields.qanTitle, 5);
  },
};
