const assert = require('assert');

Feature('Performance test of PMM UI');

Scenario(
  'PMM-T7 Verify performance of PMM instance. @not-ui-pipeline @perf-testing',
  async ({
    I, homePage, pmmInventoryPage, pmmSettingsPage, allChecksPage,
  }) => {
    await I.Authorize();
    await I.amOnPage('');
    const newTabs = await I.openNewTabs(4);
    const addresses = [homePage.landingUrl, pmmInventoryPage.url, pmmSettingsPage.url, allChecksPage.url];

    for (const [i, tab] of newTabs.entries()) {
      await I.navigateTabTo(tab, addresses[i]);
      const loadTime = await I.getPageTimeToLoad(tab);

      assert.ok(parseInt(loadTime, 10) < 10000, `PMM took over the test seconds to load for the address + ${addresses[i]}`);
    }
  },
);
