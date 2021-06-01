const assert = require('assert');
const { communicationData } = require('./testData');
const perconaPlatform = require('./perconaPlatform');

const { I, adminPage, links } = inject();

const locateLabel = (selector) => locate(I.useDataQA(selector)).find('span');

module.exports = {
  url: 'graph/settings',
  advancedSettingsUrl: 'graph/settings/advanced-settings',
  communicationSettingsUrl: 'graph/settings/communication',
  perconaPlatform,
  prometheusAlertUrl: '/prometheus/rules',
  stateOfAlertsUrl: '/prometheus/alerts',
  diagnosticsText:
    'You can download server logs to make the problem detection simpler. '
    + 'Please include this file if you are submitting a bug report.',
  agreementText:
    'Check here to indicate that you have read and agree to the \nTerms of Service\n and \nPrivacy Policy',
  alertManager: {
    ip: process.env.VM_IP,
    service: ':9093/#/alerts',
    externalAlertManagerPort: ':9093',
    rule:
      'groups:\n'
      + '  - name: AutoTestAlerts\n'
      + '    rules:\n'
      + '    - alert: InstanceDown\n'
      + '      expr: up == 1\n'
      + '      for: 2s\n'
      + '      labels:\n'
      + '        severity: critical\n'
      + '      annotations:\n'
      + '        summary: "Instance {{ $labels.instance }} down"\n'
      + '        description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 20 seconds."',
    rule2:
      'groups:\n'
      + '  - name: Test2Alerts\n'
      + '    rules:\n'
      + '    - alert: InstanceUp\n'
      + '      expr: up == 1\n'
      + '      for: 1s\n'
      + '      labels:\n'
      + '        severity: critical\n'
      + '      annotations:\n'
      + '        summary: "Instance {{ $labels.instance }} up"\n'
      + '        description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 5 minutes."',
    editRule:
      'groups:\n'
      + '  - name: AutoTestAlertsEdited\n'
      + '    rules:\n'
      + '    - alert: InstanceDown\n'
      + '      expr: up == 0\n'
      + '      for: 60s\n'
      + '      labels:\n'
      + '        severity: critical\n'
      + '      annotations:\n'
      + '        summary: "Instance {{ $labels.instance }} down"\n'
      + '        description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than {{ sec }} seconds."',
    ruleName: 'AutoTestAlerts',
    editRuleName: 'AutoTestAlertsEdited',
    ruleName2: 'Test2Alerts',
  },
  messages: {
    successPopUpMessage: 'Settings updated',
    invalidDataDurationMessage: 'Value should be in the range from 1 to 3650',
    invalidDataDurationPopUpMessage: 'data_retention: should be a natural number of days',
    requiredFieldMessage: 'Required field',
    invalidSSHKeyMessage: 'Invalid SSH key.',
    successAlertmanagerMessage: 'Alertmanager settings updated',
    invalidAlertmanagerMissingSchemeMessage:
      'Invalid alert_manager_url: invalid_url - missing protocol scheme.',
    invalidAlertmanagerMissingHostMessage: 'Invalid alert_manager_url: http:// - missing host.',
    invalidAlertmanagerRulesMessage: 'Invalid alerting rules.',
    invalidDBaaSDisableMessage: 'DBaaS is enabled via ENABLE_DBAAS or via deprecated PERCONA_TEST_DBAAS environment variable.',
  },
  sectionTabsList: {
    metrics: 'Metrics Resolution',
    advanced: 'Advanced Settings',
    ssh: 'SSH Key',
    alertmanager: 'Alertmanager Integration',
    perconaPlatform: 'Percona Platform',
  },
  sectionButtonText: {
    applyChanges: 'Apply changes',
    applySSHKey: 'Apply SSH key',
    applyAlertmanager: 'Apply Alertmanager settings',
  },
  tooltips: {
    stt: {
      text: 'Enable Security Threat Tool and get updated checks from Percona.',
      link: links.sttDocs,
    },
    integratedAlerting: {
      text: 'Option to enable/disable Integrated Alerting features.',
      link: links.integratedAlertingDocs,
    },
    serverAddress: {
      text: 'The SMTP host server address through which emails are sent',
      link: links.communicationDocs,
    },
    hello: {
      text: 'The hostname to identify the SMTP server',
      link: links.communicationDocs,
    },
    from: {
      text: 'The sender address',
      link: links.communicationDocs,
    },
    auth: {
      text: 'SMTP authentication information',
      link: links.communicationDocs,
    },
    authType: {
      text: 'Authentication type',
      link: links.communicationDocs,
    },
    slackUrl: {
      text: 'Slack incoming webhook URL',
      link: links.communicationDocs,
    },
  },
  communicationData,
  communication: {
    email: {
      serverAddress: {
        tooltipLocator: locate('div').after(locate('span').withText('Server Address')),
        locator: '$smarthost-text-input',
      },
      hello: {
        tooltipLocator: locate('div').after(locate('span').withText('Hello')),
        locator: '$hello-text-input',
      },
      from: {
        tooltipLocator: locate('div').after(locate('span').withText('From')),
        locator: '$from-text-input',
      },
      authType: {
        tooltipLocator: locate('div').after(locate('span').withText('Auth Type')),
        locator: '$hello-text-input',
      },
      username: {
        tooltipLocator: locate('div').after(locate('span').withText('Username')),
        locator: '$username-text-input',
      },
      password: {
        tooltipLocator: locate('div').after(locate('span').withText('Password')),
        locator: '$password-password-input',
      },
    },
    slack: {
      url: {
        tooltipLocator: locate('div').after(locate('span').withText('URL')),
        locator: '$url-text-input',
        value: 'https://hook',
      },
    },
    communicationSection: locate('$settings-tabs')
      .find('li')
      .withAttr({ 'aria-label': 'Tab Communication' }),
    emailTab: 'li[aria-label="Tab Email"]',
    submitEmailButton: '$email-settings-submit-button',
    slackTab: 'li[aria-label="Tab Slack"]',
    submitSlackButton: '$slack-settings--submit-button',
  },
  fields: {
    advancedLabel: '$advanced-label',
    advancedButton: '$advanced-button',
    addAlertRuleButton: '//span[text()="Apply Alertmanager settings"]/parent::span',
    alertRulesInput: '$alertmanager-rules',
    alertURLInput: '$alertmanager-url',
    alertingRules: locateLabel('form-field-alerting-rules'),
    alertmanagerUrlLabel: '$alertmanager-url-label',
    alertmanagerRulesLabel: '$alertmanager-rules-label',
    alertmanagerButton: '$alertmanager-button',
    amUrlLabel: locateLabel('form-field-am-url'),
    applyButton: '//button[@type="submit"]',
    callHomeSwitch: '//button[@class="toggle-field ant-switch ant-switch-checked"]',
    checkForUpdatesLabel: '//div[@data-qa="advanced-updates"]//div//span',
    checkForUpdatesSwitch: '//div[@data-qa="advanced-updates"]//div[2]//input',
    dataRetentionInput: '$retention-number-input',
    dataRetentionLabel: locateLabel('form-field-data-retention'),
    diagnosticsButton: '$diagnostics-button',
    diagnosticsLabel: '$diagnostics-label',
    downloadLogsButton: '//a[@class="ant-btn" and @href="/logs.zip"]',
    diagnosticsInfo: '//div[@data-qa="diagnostics-label"]/div/div',
    iframe: '//div[@class="panel-content"]//iframe',
    metricsResolutionButton: '$metrics-resolution-button',
    metricsResolution: '//label[text()="',
    metricsResolutionLabel: '$metrics-resolution-label',
    metricsResolutionRadio: '$resolutions-radio-button',
    microsoftAzureMonitoringSwitch: locate('$advanced-azure-discover').find('//div[2]//label'),
    microsoftAzureMonitoringSwitchInput: locate('$advanced-azure-discover').find('//div[2]//input'),
    loginButton: '$sign-in-submit-button',
    lowInput: '$lr-number-input',
    mediumInput: '$mr-number-input',
    highInput: '$hr-number-input',
    perconaPlatformLink: '//li[contains(text(), \'Percona Platform\')]',
    privacyPolicy: '//span[contains(text(), "Privacy Policy")]',
    publicAddressInput: '$publicAddress-text-input',
    publicAddressButton: '$public-address-button',
    sectionHeader: '//div[@class="ant-collapse-header"]',
    selectedResolution: 'span.ant-slider-mark-text-active',
    signInEmail: '$email-text-input',
    signInPassword: '$email-text-input',
    sshKeyInput: '$ssh-key',
    sshKeyLabel: locateLabel('ssh-key-label'),
    sshKeyButton: '$ssh-key-button',
    sttLabel: '//div[@data-qa="advanced-stt"]//div//span',
    sttLabelTooltipSelector: '//div[@data-qa="advanced-stt"]//div//div//div//div',
    sttSwitchSelectorInput: '//div[@data-qa="advanced-stt"]//div[2]//input',
    sttSwitchSelector: '//div[@data-qa="advanced-stt"]//div[2]//label',
    subSectionHeader: '//following-sibling::div//div[@class="ant-collapse-header"]',
    signUpEmail: '$email-text-input',
    signUpPassword: '$password-password-input',
    signUpAgreementLabel: '$sign-up-agreement-checkbox-label',
    signUpButton: '$sign-up-submit-button',
    singInToSignUpButton: '$sign-in-to-sign-up-button',
    signUpBackToLogin: '$sign-up-to-sign-in-button',
    telemetrySwitchSelectorInput: '//div[@data-qa="advanced-telemetry"]//div[2]//input',
    telemetrySwitchSelector: '//div[@data-qa="advanced-telemetry"]//div[2]//label',
    iaSwitchSelectorInput: '//div[@data-qa="advanced-alerting"]//div[2]//input',
    iaSwitchSelector: '//div[@data-qa="advanced-alerting"]//div[2]//label',
    telemetryLabel: '//div[@data-qa="advanced-telemetry"]//div//span',
    tooltipSelector: '.popper__background',
    tabsSection: '$settings-tabs',
    tabContent: '$settings-tab-content',
    termsOfService: '//span[contains(text(), "Terms of Service")]',
    validationMessage: 'span.error-message',
    iaLabelTooltipSelector: locate('$advanced-alerting').find('div[class$="-Icon"]'),
    rareIntervalInput: '$rareInterval-number-input',
    rareIntervalValidation: '$rareInterval-field-error-message',
    standartIntervalInput: '$standardInterval-number-input',
    standartIntervalValidation: '$standardInterval-field-error-message',
    frequentIntervalInput: '$frequentInterval-number-input',
    frequentIntervalValidation: '$frequentInterval-field-error-message',
    dbaasSwitchSelectorInput: locate('$advanced-dbaas').find('//div[2]//input'),
    dbaasSwitchSelector: locate('$advanced-dbaas').find('//div[2]//label'),
  },

  switchAzure() {
    I.waitForVisible(this.fields.microsoftAzureMonitoringSwitch, 30);
    I.click(this.fields.microsoftAzureMonitoringSwitch);
    I.waitForVisible(this.fields.advancedButton, 30);
    I.click(this.fields.advancedButton);
  },

  async waitForPmmSettingsPageLoaded() {
    I.waitForVisible(this.fields.tabsSection, 30);
    I.waitForVisible(this.fields.tabContent, 30);
    I.waitForVisible(this.fields.diagnosticsLabel, 30);
    I.waitForVisible(this.fields.diagnosticsButton, 30);
  },
  async expandSection(sectionName, expectedContentLocator) {
    const sectionExpandLocator = `//ul[@data-qa="settings-tabs"]//li[contains(text(), '${sectionName}')]`;

    I.click(sectionExpandLocator);
    I.waitForVisible(expectedContentLocator, 30);
  },

  fillCommunicationFields(fields) {
    const {
      type, serverAddress, hello, from, authType, username, password, url,
    } = fields;

    if (url && type === 'slack') {
      I.click(this.communication.slackTab);

      I.waitForVisible(this.communication.slack.url.locator, 30);
      I.clearField(this.communication.slack.url.locator);
      I.fillField(this.communication.slack.url.locator, url);

      I.click(this.communication.submitSlackButton);
    }

    if (type === 'email') {
      I.waitForVisible(this.communication.email.serverAddress.locator, 30);
      I.clearField(this.communication.email.serverAddress.locator);
      I.fillField(this.communication.email.serverAddress.locator, serverAddress);
      I.clearField(this.communication.email.hello.locator);
      I.fillField(this.communication.email.hello.locator, hello);
      I.clearField(this.communication.email.from.locator);
      I.fillField(this.communication.email.from.locator, from);

      I.click(locate('label').withText(authType));

      if (/Plain|Login|CRAM-MD5/.test(authType)) {
        I.clearField(this.communication.email.username.locator);
        I.fillField(this.communication.email.username.locator, username);
        I.clearField(this.communication.email.password.locator);
        I.fillField(this.communication.email.password.locator, password);
      }

      I.click(this.communication.submitEmailButton);
    }
  },

  async disableIA() {
    const iaEnabled = await I.grabAttributeFrom(this.fields.iaSwitchSelectorInput, 'checked');

    if (iaEnabled) {
      I.click(this.fields.iaSwitchSelector);
    }
  },

  async verifyCommunicationFields(fields) {
    const {
      type, serverAddress, hello, from, authType, username, url,
    } = fields;

    if (type === 'slack') {
      I.click(this.communication.slackTab);
      I.waitForVisible(this.communication.slack.url.locator, 30);
      I.seeInField(this.communication.slack.url.locator, url);
    }

    if (type === 'email') {
      I.waitForVisible(this.communication.email.serverAddress.locator, 30);
      I.seeInField(this.communication.email.serverAddress.locator, serverAddress);
      I.seeInField(this.communication.email.hello.locator, hello);
      I.seeInField(this.communication.email.from.locator, from);

      if (/Plain|Login|CRAM-MD5/.test(authType)) {
        I.seeInField(this.communication.email.username.locator, username);
        I.seeAttributesOnElements(this.communication.email.password.locator, { type: 'password' });
      }
    }
  },

  async selectMetricsResolution(resolution) {
    I.waitForElement(`${this.fields.metricsResolution + resolution}"]`, 30);
    I.click(`${this.fields.metricsResolution + resolution}"]`);
    I.click(this.fields.metricsResolutionButton);
  },

  async verifySelectedResolution(resolution) {
    const selector = '$resolutions-radio-state';

    I.waitForElement(selector, 30);
    const value = await I.grabAttributeFrom(selector, 'value');

    assert.equal(value.includes(resolution.toLowerCase()), true, 'Metric resolution should be selected');
  },

  customClearField(field) {
    I.appendField(field, '');
    I.pressKey(['Control', 'a']);
    I.pressKey('Backspace');
  },

  changeDataRetentionValueTo(days) {
    I.clearField(this.fields.dataRetentionInput);
    I.fillField(this.fields.dataRetentionInput, days);
    I.click(this.fields.advancedButton);
  },

  checkDataRetentionInput(value, message) {
    const messageField = `//div[contains(text(), '${message}')]`;

    I.clearField(this.fields.dataRetentionInput);
    I.fillField(this.fields.dataRetentionInput, value);
    I.seeElement(messageField);
  },

  addSSHKey(keyValue) {
    I.fillField(this.fields.sshKeyInput, keyValue);
    I.click(this.fields.sshKeyButton);
  },

  addPublicAddress(address = process.env.SERVER_IP) {
    I.fillField(this.fields.publicAddressInput, address);
    I.click(this.fields.advancedButton);
    I.verifyPopUpMessage(this.messages.successPopUpMessage);
  },

  addAlertmanagerRule(url, rule) {
    adminPage.customClearField(this.fields.alertURLInput);
    I.fillField(this.fields.alertURLInput, url);
    adminPage.customClearField(this.fields.alertRulesInput);
    I.fillField(this.fields.alertRulesInput, rule);
    I.waitForElement(this.fields.alertmanagerButton, 30);
    I.click(this.fields.alertmanagerButton);
  },

  openAlertsManagerUi() {
    I.amOnPage(this.prometheusAlertUrl);
  },

  async verifyAlertmanagerRuleAdded(ruleName, checkState = false) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    for (let i = 0; i < 30; i++) {
      let response;

      if (checkState) {
        response = await I.sendGetRequest('prometheus/alerts', headers);
      } else {
        response = await I.sendGetRequest('prometheus/rules', headers);
      }

      if (JSON.stringify(response.data.data).includes(ruleName)) {
        I.refreshPage();
        break;
      }

      I.refreshPage();
      I.wait(5);
    }

    I.seeElement(`//pre[contains(text(), '${ruleName}')]`);
    I.see(ruleName);
  },

  async verifyExternalAlertManager(ruleName) {
    let response;

    for (let i = 0; i < 20; i++) {
      response = await I.sendGetRequest(
        `http://${this.alertManager.ip}${this.alertManager.externalAlertManagerPort}/api/v2/alerts/groups?silenced=false&inhibited=false&active=true`,
      );
      if (JSON.stringify(response.data).includes(ruleName)) {
        break;
      }

      I.wait(5);
    }

    assert.equal(
      JSON.stringify(response.data).includes(ruleName),
      true,
      'Alert Should be firing at External Alert Manager',
    );
  },

  async verifyTooltip(tooltipObj) {
    I.waitForVisible(this.fields.tooltipSelector, 30);
    I.seeTextEquals(`${tooltipObj.text}\nRead more`, this.fields.tooltipSelector);
    I.seeAttributesOnElements(`${this.fields.tooltipSelector} > div > a`, { href: tooltipObj.link });
  },

  verifySwitch(switchSelector, expectedSwitchState = 'on') {
    switch (expectedSwitchState) {
      case 'on':
        I.seeCheckboxIsChecked(switchSelector);
        break;
      case 'off':
        I.dontSeeCheckboxIsChecked(switchSelector);
        break;
      default:
    }
  },
};
