const { I } = inject();

module.exports = {
  url: 'graph/entitlements',
  elements: {
    ticketTable: '$table',
    ticketTableHead: '//*[@data-testid="table-thead"]//tr',
    tableRow: '//div[@title="Click to expand"]',
    header: '//body//*[contains(text(), "Entitlements")]',
    entitlementsMenuIcon: '//*[contains(@href, "/graph/entitlements")]',
    notPlatformUser: '$empty-block',
    noDataPage: '$page-no-data',
    ticketTableSpinner: '$spinner-wrapper',
  },
  fields: {},
  buttons: {},
  messages: {
    loginWithPercona: 'Not connected to Portal. You can connect in Platform Settings.',
    noTicketsFound: 'No entitlements found',
  },
};
