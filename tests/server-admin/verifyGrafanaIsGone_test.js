const assert = require('assert');

Before(async ({
    I
  }) => {
    await I.Authorize();
  });
Scenario(
    'PMM-10162 Verify that Grafana Enterprise is not present @admin',
    async ({
      I, stastsAndLicense,
    }) => {
      I.amOnPage(stastsAndLicense.url);
      I.seeElement(stastsAndLicense.buttons.contactUs);
      //I.waitForVisible(pmmSettingsPage.fields.rareIntervalInput, 30);
  
      // // Verify that you can see element
      //I.seeElementsEnabled(pmmSettingsPage.fields.rareIntervalInput);
    },
  );