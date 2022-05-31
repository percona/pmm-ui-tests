Feature('Portal Integration with PMM');

Scenario(
  'PMM-T398 PMM-T809 Verify Connect to Percona Portal elements @portal @pre-pmm-portal-upgrade',
  async ({
    I, homePage, pmmInventoryPage, pmmSettingsPage, allChecksPage,
  }) => {
    await I.Authorize();
    const newTabs = await I.openNewTabs(4);
    const addresses = [homePage.landingUrl, pmmInventoryPage.url, pmmSettingsPage.url, allChecksPage.url];

    for (const [i, tab] of newTabs.entries()) {
      await I.navigateTabTo(tab, addresses[i]);
      await I.say(`Page load time was ${await I.getPageTimeLoad(tab)}ms`);
    }
  },
);
