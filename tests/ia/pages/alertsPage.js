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
  colors: {
    critical: 'rgb(224, 47, 68)',
    high: 'rgb(235, 123, 24)',
    notice: 'rgb(50, 116, 217)',
    warning: 'rgb(236, 187, 19)',
    silence: 'rgb(199, 208, 217)',
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

  async checkAllAlertsColor(expectedStates) {
    const alertsStates = await I.grabTextFromAll('//td[3]');
    const criticalColor = await I.grabCssPropertyFrom(this.elements.criticalSeverity, 'color');
    const highColor = await I.grabCssPropertyFrom(this.elements.highSeverity, 'color');
    const noticeColor = await I.grabCssPropertyFrom(this.elements.noticeSeverity, 'color');
    const warningColor = await I.grabCssPropertyFrom(this.elements.warningSeverity, 'color');

    for (const i in alertsStates) {
      assert.equal(alertsStates[i], expectedStates, `Alert has not ${expectedStates} state`);
    }

    if (expectedStates === 'Silenced') {
      assert.equal(criticalColor, this.colors.silence, 'Critical alert is unsilence');
      assert.equal(highColor, this.colors.silence, 'High alert is unsilence');
      assert.equal(noticeColor, this.colors.silence, 'Notice alert is unsilence');
      assert.equal(warningColor, this.colors.silence, 'Warning alert is unsilence');
    } else {
      assert.equal(criticalColor, this.colors.critical, 'Critical alert is silence');
      assert.equal(highColor, this.colors.high, 'High alert is silence');
      assert.equal(noticeColor, this.colors.notice, 'Notice alert is silence');
      assert.equal(warningColor, this.colors.warning, 'Warning alert is silence');
    }
  },
};
