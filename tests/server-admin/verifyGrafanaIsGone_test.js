const assert = require('assert');
Feature('Grafana-Enterprise');
Before(async ({
    I
  }) => {
    await I.Authorize();
  });
Scenario(
    'PMM-10162 Verify that Grafana Enterprise is not present @admin',
    async ({
      I, stastsAndLicensePage,
    }) => {
      I.amOnPage(stastsAndLicensePage.url);
      I.seeElement(stastsAndLicensePage.buttons.contactUs);
      //I.waitForVisible(pmmSettingsPage.fields.rareIntervalInput, 30);
  
      // // Verify that you can see element
      //I.seeElementsEnabled(pmmSettingsPage.fields.rareIntervalInput);
    },
  );