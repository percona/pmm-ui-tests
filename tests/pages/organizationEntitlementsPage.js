const { I } = inject();

module.exports = {
  url: 'graph/entitlements',
  elements: {
    ticketTable: '$table',
    ticketTableHead: '//*[@data-testid="table-thead"]//tr',
    tableRow: '//div[@title="Click to expand"]',
    header: '//body//*[contains(text(), "Entitlements")]',
    entitlementsMenuIcon: '//*[contains(@href, "/graph/entitlements")]',
    notPlatformUser: '$not-platform-user',
    noDataPage: '$page-no-data',
    ticketTableSpinner: '$spinner-wrapper',
  },
  fields: {},
  buttons: {},
  messages: {
    loginWithPercona: 'Login with Percona Account to access this content',
    noTicketsFound: 'No entitlements found',
  },
};
