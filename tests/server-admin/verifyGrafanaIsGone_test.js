const { fields } = require('./pages/stastsAndLicensePage');
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
      I.seeElement(stastsAndLicensePage.fields.enterpriseLicense);
      I.seeElement(stastsAndLicensePage.fields.dataSourcePermission);
      Object.values(fields).forEach(val => I.seeElement(val));
   
    },
  );