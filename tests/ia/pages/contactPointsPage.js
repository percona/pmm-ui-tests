const assert = require('assert');
const {
  I, iaCommon,
} = inject();

module.exports = {
  url: 'graph/alerting/notifications',
  elements: {
    cPHeader: locate('h4').withText('Contact points'),
  },
  buttons: {
    newContactPoint: locate('button').find('span').withText('New contact point'),
    saveCP: locate('button').find('span').withText('Save contact point'),
  },
  messages: {
    cPCreatedSuccess: 'Contact point created',
  },
  id: {
    cPTypeInput: 'contact-point-type-items.0.',
    webhookUrlInput: 'items.0.secureSettings.url',
  },


  openContactPointsTab() {
    I.amOnPage(this.url);
    I.waitForVisible(this.elements.cPHeader, 10);
  },

  createSlackCP(name) {
    I.waitForVisible(this.buttons.newContactPoint);
    I.click(this.buttons.newContactPoint);
    I.waitForVisible(iaCommon.elements.inputField(this.id.cPTypeInput));
    I.click(iaCommon.elements.inputField(this.id.cPTypeInput));
    I.waitForVisible(iaCommon.elements.selectDropdownOption('Slack'));
    I.click(iaCommon.elements.selectDropdownOption('Slack'));
    I.fillField(iaCommon.elements.inputField('name'), name);
    I.fillField(iaCommon.elements.inputField(this.id.webhookUrlInput), name); //TODO
    I.click(this.buttons.saveCP);
  },
}
