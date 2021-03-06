const { I } = inject();
const assert = require('assert');

const alertRow = (alertName) => `//tr[td[contains(., "${alertName}")]]`;
const details = '$alert-details-wrapper';

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
    errorSeverity: '//td[2]/span[text()="Error"]',
    noticeSeverity: '//td[2]/span[text()="Notice"]',
    warningSeverity: '//td[2]/span[text()="Warning"]',
    columnHeaderLocator: (columnHeaderText) => `//th[text()="${columnHeaderText}"]`,
    details,
    detailsRuleExpression: locate(details).find('div').withText('Rule Expression'),
    detailsSecondaryLabels: locate(details).find('div').withText('Secondary Labels'),
    primaryLabels: (alertName, text) => locate(`${alertRow(alertName)}/td[4]`).find('$chip').withText(text),
    secondaryLabels: (text) => locate(details).find('$chip').withText(text),
  },
  buttons: {
    // silenceActivate returns silence/activate button locator for a given alert name
    silenceActivate: (alertName) => `${alertRow(alertName)}[1]/td//button[@data-testid="silence-button"]`,
    silenceAllAlerts: locate('span').withText('Silence All'),
    unsilenceAllAlerts: locate('span').withText('Unsilence All'),
    arrowIcon: (alertName) => locate(`${alertRow(alertName)}`).find('$show-details'),
  },
  messages: {
    noAlertsFound: 'No alerts',
    successfullySilenced: 'Alert silenced',
    successfullyActivated: 'Alert activated',
  },
  colors: {
    critical: 'rgb(212, 74, 58)',
    error: 'rgb(235, 123, 24)',
    notice: 'rgb(50, 116, 217)',
    warning: 'rgb(236, 187, 19)',
    silence: 'rgb(204, 204, 220)',
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
    const errorColor = await I.grabCssPropertyFrom(this.elements.errorSeverity, 'color');
    const noticeColor = await I.grabCssPropertyFrom(this.elements.noticeSeverity, 'color');
    const warningColor = await I.grabCssPropertyFrom(this.elements.warningSeverity, 'color');

    for (const i in alertsStates) {
      assert.equal(alertsStates[i], expectedStates, `Alert has not ${expectedStates} state`);
    }

    if (expectedStates === 'Silenced') {
      assert.equal(criticalColor, this.colors.silence, 'Critical alert is unsilence');
      assert.equal(errorColor, this.colors.silence, 'Error alert is unsilence');
      assert.equal(noticeColor, this.colors.silence, 'Notice alert is unsilence');
      assert.equal(warningColor, this.colors.silence, 'Warning alert is unsilence');
    } else {
      assert.equal(criticalColor, this.colors.critical, 'Critical alert is silence');
      assert.equal(errorColor, this.colors.error, 'Error alert is silence');
      assert.equal(noticeColor, this.colors.notice, 'Notice alert is silence');
      assert.equal(warningColor, this.colors.warning, 'Warning alert is silence');
    }
  },

  checkContainingLabels({ primaryLabels = null, secondaryLabels = null, alertName = null }) {
    for (const i in primaryLabels) I.seeElement(this.elements.primaryLabels(alertName, primaryLabels[i]));

    for (const i in secondaryLabels) I.seeElement(this.elements.secondaryLabels(secondaryLabels[i]));
  },
};
