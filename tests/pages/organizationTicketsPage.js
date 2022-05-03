const { I } = inject();

module.exports = {
  url: 'graph/tickets',
  elements: {
    ticketTable: '$table',
  },
  fields: {
  },
  buttons: {
  },
  messages: {
  },

  async openTicketPage() {
    I.amOnPage(this.url);
    await I.waitForVisible(this.elements.ticketTable);
  },
};
