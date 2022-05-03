const { I } = inject();

module.exports = {
  url: 'graph/tickets',
  serviceNowUrl: 'perconadev.service-now.com/percona',
  elements: {
    ticketTable: '$table',
    ticketTableHead: '//*[@data-testid="table-thead"]//tr',
    ticketTableRows: '//*[@data-testid="table-tbody"]//tr',
    header: '//h1[contains(text(), "List of tickets opened by Customer Organization")]',
    subHeader: '//div[contains(text(), "Percona Support Tickets from Portal")]',
  },
  fields: {
  },
  buttons: {
  },
  messages: {
  },
};
