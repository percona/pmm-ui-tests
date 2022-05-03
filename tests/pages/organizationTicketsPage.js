const { I } = inject();

module.exports = {
  url: 'graph/tickets',
  serviceNowUrl: 'perconadev.service-now.com/percona',
  elements: {
    ticketTable: '$table',
    ticketTableHead: '//*[@data-testid="table-thead"]//tr',
    ticketTableRows: '//*[@data-testid="table-tbody"]//tr',
    header: '//body//*[contains(text(), "List of tickets opened by Customer Organization")]',
    ticketsMenuIcon: '//*[@aria-label="Support Tickets"]',
    notPlatformUser: '$not-platform-user',
  },
  fields: {
  },
  buttons: {
  },
  messages: {
    loginWithPercona: 'Login with Percona Account to access this content',
  },
};
