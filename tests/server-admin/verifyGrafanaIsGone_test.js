Feature('Grafana-EnterpriseAds');

Before(async ({
  I,
}) => {
  await I.Authorize();
});

Scenario(
  'PMM-10162 Verify that Grafana Enterprise is not present @grafana-pr',
  async ({
    I, statsAndLicensePage,
  }) => {
    I.amOnPage(statsAndLicensePage.url);
    await statsAndLicensePage.waitForStatsAndLicensePageLoaded();
    Object.values(statsAndLicensePage.fields).forEach((val) => I.dontSeeElement(val));
  },
);
