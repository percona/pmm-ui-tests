const { I } = inject();

module.exports = {
  url: 'graph/tickets',
  serviceNowUrl: 'perconadev.service-now.com/percona',
  elements: {
    ticketTable: '$table',
    ticketTableHead: '//*[@data-testid="table-thead"]//tr',
    ticketTableRows: '//*[@data-testid="table-tbody"]//tr',
    header: '//*[contains(text(), "List of tickets opened by Customer Organization")]',
  },
  fields: {
  },
  buttons: {
  },
  messages: {
  },
};
