const assert = require('assert');
const {
  I, iaCommon,
} = inject();

module.exports = {
  url: 'graph/alerting/notifications',
  elements: {
    cPHeader: locate('h4').withText('Contact points'),
    cPTable: '$dynamic-table',
    deleteCPDialogHeader: locate('h2').withText('Delete contact point'),
    cannotdeleteCPDialogHeader: locate('h2').withText('Cannot delete contact point'),
    cPEditHeader: locate('h4').withText('Update contact point'),
  },
  buttons: {
    newContactPoint: locate('button').find('span').withText('New contact point'),
    saveCP: locate('button').find('span').withText('Save contact point'),
    deleteCP: (rowNumber) =>  locate('button').withAttr({ 'aria-label': 'Delete contact point' }).at(rowNumber),
    confirmDeleteCP: locate('button').find('span').withText('Yes, delete'),
    editCP: (rowNumber) =>  locate('$edit').at(rowNumber),
    closeModal: locate('button').find('span').withText('Close'),
    testCP: locate('button').find('span').withText('Test'),
    sendTest: locate('button').find('span').withText('Send test notification'), 
  },
  messages: {
    cPCreatedSuccess: 'Contact point created',
    cPDeletedSuccess: 'Contact point deleted.',
    cPCannotDelete: 'Contact point cannot be deleted because it is used in more policies. Please update or delete these policies first.',
    deleteCPConfirm: (name) => `Are you sure you want to delete contact point "${name}"?`,
    cPEditedSuccess: 'Contact point updated.',
    missingRequired: 'There are errors in the form. Please correct them and try again!',
    testNotification: 'You will send a test notification that uses a predefined alert. If you have defined a custom template or message, for better results switch to custom notification message, from above.',
    testSent: 'Test alert sent.',
  },
  id: {
    cPTypeInput: 'contact-point-type-items.0.',
    webhookUrlInput: 'items.0.secureSettings.url',
    url: 'items.0.settings.url',
    key: 'items.0.secureSettings.integrationKey',
  },


  async openContactPointsTab() {
    I.amOnPage(this.url);
    I.waitForVisible(this.elements.cPHeader, 10);
  },

  async createCP(name, type) {
    I.waitForVisible(this.buttons.newContactPoint, 10);
    I.click(this.buttons.newContactPoint);
    I.waitForVisible(iaCommon.elements.inputField(this.id.cPTypeInput), 10);
    I.click(iaCommon.elements.inputField(this.id.cPTypeInput));
    I.waitForVisible(iaCommon.elements.selectDropdownOption(type), 10);
    I.click(iaCommon.elements.selectDropdownOption(type));
    I.fillField(iaCommon.elements.inputField('name'), name);
  },

  async deleteCP(rowNumber) {
    I.waitForVisible(this.buttons.deleteCP(rowNumber), 10);
    I.click(this.buttons.deleteCP(rowNumber));
  },

  async verifyCPInTable(name) {
    I.waitForVisible(this.elements.cPTable, 10);
    I.see(name, this.elements.cPTable);
  }
}
