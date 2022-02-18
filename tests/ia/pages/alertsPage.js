const { I } = inject();
const assert = require('assert');

const alertRow = (alertName) => `//tr[td[contains(., "${alertName}")]]`;

module.exports = {
  url: 'graph/integrated-alerting/alerts',
  columnHeaders: ['Name', 'Severity', 'State', 'Labels', 'Active Since', 'Last Notified', 'Actions'],
  elements: {
    noData: '$table-no-data',
    alertRow: (alertName) => alertRow(alertName),
    labelsCell: (alertName) => `${alertRow(alertName)}/td[4]//span`,
    stateCell: (alertName) => `${alertRow(alertName)}/td[3]`,
    severityCell: (alertName) => `${alertRow(alertName)}/td[2]`,
    criticalSeverity: '//td[2]/span[text()="Critical"]',
    highSeverity: '//td[2]/span[text()="High"]',
    noticeSeverity: '//td[2]/span[text()="Notice"]',
    warningSeverity: '//td[2]/span[text()="Warning"]',
    columnHeaderLocator: (columnHeaderText) => `//th[text()="${columnHeaderText}"]`,
  },
  buttons: {
    // silenceActivate returns silence/activate button locator for a given alert name
    silenceActivate: (alertName) => `${alertRow(alertName)}[1]/td//button[@data-testid="silence-alert-button"]`,
    silenceAllAlerts: locate('span').withText('Silence All'),
    unsilenceAllAlerts: locate('span').withText('Unsilence All'),
  },
  messages: {
    noAlertsFound: 'No alerts',
    successfullySilenced: 'Alert silenced',
    successfullyActivated: 'Alert activated',
  },

  async silenceAlert(alertName) {
    const title = await I.grabAttributeFrom(this.buttons.silenceActivate(alertName), 'title');

    if (title === 'Silence') {
      const bgColorBeforeAction = await I.grabCssPropertyFrom(
        `${this.elements.alertRow(alertName)}/td`,
        'background-color',
      );

      I.click(this.buttons.silenceActivate(alertName));
      I.verifyPopUpMessage(this.messages.successfullySilenced);
      I.seeTextEquals('Silenced', this.elements.stateCell(alertName));
      const bgColorAfterAction = await I.grabCssPropertyFrom(
        `${this.elements.alertRow(alertName)}/td`,
        'background-color',
      );

      assert.ok(
        bgColorBeforeAction !== bgColorAfterAction,
        'Cell background color should change after silencing the alert',
      );
    }
  },

  async activateAlert(alertName) {
    const title = await I.grabAttributeFrom(`${this.buttons.silenceActivate(alertName)}`, 'title');

    if (title === 'Activate') {
      const bgColorBeforeAction = await I.grabCssPropertyFrom(
        `${this.elements.alertRow(alertName)}/td`,
        'background-color',
      );

      I.click(`${this.buttons.silenceActivate(alertName)}`);
      I.verifyPopUpMessage(this.messages.successfullyActivated);
      I.seeTextEquals('Firing', this.elements.stateCell(alertName));
      const bgColorAfterAction = await I.grabCssPropertyFrom(
        `${this.elements.alertRow(alertName)}/td`,
        'background-color',
      );

      assert.ok(
        bgColorBeforeAction !== bgColorAfterAction,
        'Cell background color should change after activating the alert',
      );
    }
  },

  async checkAllAlertsStateAndColor(alertsExpectedStates) {
    const critical = 'rgb(224, 47, 68)';
    const high = 'rgb(235, 123, 24)';
    const notice = 'rgb(50, 116, 217)';
    const warning = 'rgb(236, 187, 19)';
    const alertsStates = await I.grabTextFromAll('//td[3]');
    const alertsColors = await I.grabCssPropertyFromAll('//td[2]/span', 'color');

    if (alertsExpectedStates === 'Silenced') {
      assert.ok(alertsStates.includes('Silenced'), `Alerts have not Silenced state`);
      assert.ok(!alertsStates.includes('Firing'), `Alerts have Firing state`);
      assert.ok(!alertsColors.includes(critical), `Critical alert is unsilence`);
      assert.ok(!alertsColors.includes(high), `High alert is unsilence`);
      assert.ok(!alertsColors.includes(notice), `Notice alert is unsilence`);
      assert.ok(!alertsColors.includes(warning), `Warning alert is unsilence`);
    } else {
      assert.ok(!alertsStates.includes('Silenced'), `Alerts have Silenced state`);
      assert.ok(alertsStates.includes('Firing'), `Alerts have not Firing state`);
      assert.ok(alertsColors.includes(critical), `Critical alert is silence`);
      assert.ok(alertsColors.includes(high), `High alert is silence`);
      assert.ok(alertsColors.includes(notice), `Notice alert is silence`);
      assert.ok(alertsColors.includes(warning), `Warning alert is silence`);
    }
  }
};
