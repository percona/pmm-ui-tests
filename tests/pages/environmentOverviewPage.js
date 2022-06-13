module.exports = {
  url: 'graph/environment-overview',
  elements: {
    environmentOverviewIcon: '//*[contains(@href, "/graph/environment-overview")]',
    contactName: '$contact-name',
    notPlaformUser: '$not-platform-user',
    notConnectedToPortal: '$not-connected-platform',
    contactsHeader: locate('strong').withText(this.messages.contactsHeader),
    customerManager: locate('span').withText(this.messages.customerManager),
  },
  fields: {},
  buttons: {},
  messages: {
    contactsHeader: 'Percona Contacts',
    customerManager: 'Customer Success Manager',
    notPerconaCustomer: 'Platform account user is not a Percona customer.',
    loginWithPerconaAccount: 'Login with Percona Account to access this content',
    notConnectedToPortal: 'Not connected to Portal.',
  },
};
