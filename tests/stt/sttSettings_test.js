Feature('Security Checks: Settings').retry(2);

Before(async ({
  I, settingsAPI,
}) => {
  await I.Authorize();
  await settingsAPI.restoreCheckIntervalsDefaults();
  await settingsAPI.apiEnableSTT();
});

After(async ({ settingsAPI }) => {
  await settingsAPI.apiEnableSTT();
  await settingsAPI.restoreCheckIntervalsDefaults();
});

Scenario(
  'PMM-T649 PMM-T652 Verify default checks intervals / enabling intervals section @stt @settings',
  async ({
    I, pmmSettingsPage, settingsAPI,
  }) => {
    await settingsAPI.apiDisableSTT();
    I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
    I.waitForVisible(pmmSettingsPage.fields.rareIntervalInput, 30);

    // Verify Interval fields are disabled and have default values
    I.seeAttributesOnElements(pmmSettingsPage.fields.rareIntervalInput, { disabled: true });
    I.seeInField(pmmSettingsPage.fields.rareIntervalInput, '78');
    I.seeAttributesOnElements(pmmSettingsPage.fields.standartIntervalInput, { disabled: true });
    I.seeInField(pmmSettingsPage.fields.standartIntervalInput, '24');
    I.seeAttributesOnElements(pmmSettingsPage.fields.frequentIntervalInput, { disabled: true });
    I.seeInField(pmmSettingsPage.fields.frequentIntervalInput, '4');

    // Enable STT
    I.click(pmmSettingsPage.fields.sttSwitchSelector);
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.sttSwitchSelectorInput, 'on');

    // // Verify Interval fields are enabled
    I.seeAttributesOnElements(pmmSettingsPage.fields.rareIntervalInput, { disabled: null });
    I.seeAttributesOnElements(pmmSettingsPage.fields.standartIntervalInput, { disabled: null });
    I.seeAttributesOnElements(pmmSettingsPage.fields.frequentIntervalInput, { disabled: null });
  },
);

Scenario(
  'PMM-T650 PMM-T648 Verify user is able to set 0.1h check Frequency / custom check frequency @stt @settings',
  async ({
    I, pmmSettingsPage,
  }) => {
    I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
    I.waitForVisible(pmmSettingsPage.fields.rareIntervalInput, 30);

    // Set 0.1 values for all 3 intervals
    I.clearField(pmmSettingsPage.fields.rareIntervalInput);
    I.fillField(pmmSettingsPage.fields.rareIntervalInput, '0.1');
    I.clearField(pmmSettingsPage.fields.standartIntervalInput);
    I.fillField(pmmSettingsPage.fields.standartIntervalInput, '0.1');
    I.clearField(pmmSettingsPage.fields.frequentIntervalInput);
    I.fillField(pmmSettingsPage.fields.frequentIntervalInput, '0.1');

    // Apply Settings
    I.click(pmmSettingsPage.fields.advancedButton);
    I.verifyPopUpMessage(pmmSettingsPage.messages.successPopUpMessage);
    I.refreshPage();

    // Verify values are correct after page refresh
    I.waitForVisible(pmmSettingsPage.fields.rareIntervalInput, 30);
    I.seeInField(pmmSettingsPage.fields.rareIntervalInput, '0.1');
    I.seeInField(pmmSettingsPage.fields.standartIntervalInput, '0.1');
    I.seeInField(pmmSettingsPage.fields.frequentIntervalInput, '0.1');
  },
);

Scenario(
  'PMM-T651 Verify Check Intervals validation @stt @settings',
  async ({
    I, pmmSettingsPage,
  }) => {
    const greaterThanZero = 'Value should be greater or equal to 0.1';

    I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
    I.waitForVisible(pmmSettingsPage.fields.rareIntervalInput, 30);

    // Verify validation for 0
    I.clearField(pmmSettingsPage.fields.rareIntervalInput);
    I.fillField(pmmSettingsPage.fields.rareIntervalInput, '0');
    I.seeTextEquals(greaterThanZero, pmmSettingsPage.fields.rareIntervalValidation);

    // Verify validation for -1
    I.clearField(pmmSettingsPage.fields.rareIntervalInput);
    I.fillField(pmmSettingsPage.fields.rareIntervalInput, '-1');
    I.seeTextEquals(greaterThanZero, pmmSettingsPage.fields.rareIntervalValidation);

    // Verify validation for 0
    I.clearField(pmmSettingsPage.fields.standartIntervalInput);
    I.fillField(pmmSettingsPage.fields.standartIntervalInput, '0');
    I.seeTextEquals(greaterThanZero, pmmSettingsPage.fields.standartIntervalValidation);

    // Verify validation for -1
    I.clearField(pmmSettingsPage.fields.standartIntervalInput);
    I.fillField(pmmSettingsPage.fields.standartIntervalInput, '-1');
    I.seeTextEquals(greaterThanZero, pmmSettingsPage.fields.standartIntervalValidation);

    // Verify validation for 0
    I.clearField(pmmSettingsPage.fields.frequentIntervalInput);
    I.fillField(pmmSettingsPage.fields.frequentIntervalInput, '0');
    I.seeTextEquals(greaterThanZero, pmmSettingsPage.fields.frequentIntervalValidation);

    // Verify validation for -1
    I.clearField(pmmSettingsPage.fields.frequentIntervalInput);
    I.fillField(pmmSettingsPage.fields.frequentIntervalInput, '-1');
    I.seeTextEquals(greaterThanZero, pmmSettingsPage.fields.frequentIntervalValidation);

    I.seeAttributesOnElements(pmmSettingsPage.fields.advancedButton, { disabled: true });
  },
);
