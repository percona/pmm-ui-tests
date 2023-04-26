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
  },
  buttons: {
    newContactPoint: locate('button').find('span').withText('New contact point'),
    saveCP: locate('button').find('span').withText('Save contact point'),
    deleteCP: (rowNumber) =>  locate('button').withAttr({ 'aria-label': 'Delete contact point' }).at(rowNumber),
    confirmDeleteCP: locate('button').find('span').withText('Yes, delete'),
  },
  messages: {
    cPCreatedSuccess: 'Contact point created',
    cPDeletedSuccess: 'Contact point deleted.',
    deleteCPConfirm: (name) => `Are you sure you want to delete contact point "${name}"?`,
  },
  id: {
    cPTypeInput: 'contact-point-type-items.0.',
    webhookUrlInput: 'items.0.secureSettings.url',
  },


  async openContactPointsTab() {
    I.amOnPage(this.url);
    I.waitForVisible(this.elements.cPHeader, 10);
  },

  async createSlackCP(name) {
    I.waitForVisible(this.buttons.newContactPoint, 10);
    I.click(this.buttons.newContactPoint);
    I.waitForVisible(iaCommon.elements.inputField(this.id.cPTypeInput), 10);
    I.click(iaCommon.elements.inputField(this.id.cPTypeInput));
    I.waitForVisible(iaCommon.elements.selectDropdownOption('Slack'), 10);
    I.click(iaCommon.elements.selectDropdownOption('Slack'));
    I.fillField(iaCommon.elements.inputField('name'), name);
    I.fillField(iaCommon.elements.inputField(this.id.webhookUrlInput), name); //TODO
    I.click(this.buttons.saveCP);
  },
}
