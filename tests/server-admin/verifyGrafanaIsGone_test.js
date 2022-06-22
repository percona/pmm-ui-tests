const { fields } = require('./pages/stastsAndLicensePage');
Feature('Grafana-EnterpriseAds');
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
       stastsAndLicensePage.waitForStatsAndLicensePageLoaded();
      Object.values(fields).forEach(val =>I.dontSeeElement(val));
      
    },
  );