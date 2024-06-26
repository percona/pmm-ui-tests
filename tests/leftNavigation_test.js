const assert = require('assert');

const { leftNavMenu } = inject();

const sidebar = new DataTable(['name', 'path', 'click']);

const parse = (obj) => {
  if (obj !== null && typeof obj === 'object') {
    if ('path' in obj && 'click' in obj
      // excludes top level clickable icon
      && 'label' in obj) {
      sidebar.add([obj.label, obj.path, obj.click]);
    }

    Object.values(obj).forEach((value) => {
      // key is either an array index or object key
      parse(value);
    });
  }
};

parse(leftNavMenu);

Feature('Left Navigation menu tests').retry(1);

Before(async ({ I }) => {
  await I.Authorize();
});

Data(sidebar).Scenario(
  'PMM-T433, PMM-T591 - Verify menu items on Grafana sidebar redirects to correct page @menu',
  async ({ I, homePage, current }) => {
    await homePage.open();
    current.click();
    I.waitInUrl(current.path, 5);
  },
);

// TODO: Needs to be removed, Advisors are on by default hence no settings link anymore
xScenario(
  'PMM-T1051 - Verify PMM Settings page is opened from Home dashboard @menu',
  async ({ I, homePage, pmmSettingsPage }) => {
    await homePage.open();

    const tabsCount1 = await I.grabNumberOfOpenTabs();

    I.click(homePage.fields.failedSecurityChecksPmmSettingsLink);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();

    const tabsCount2 = await I.grabNumberOfOpenTabs();

    assert.ok(tabsCount1 === tabsCount2, 'Settings page isn\'t opened in the same tab');
  },
);

Scenario(
  '@PMM-9550 PMM-T1830 Verify downloading server diagnostics logs @menu',
  async ({ I, homePage, serverApi }) => {
    await homePage.open();
    let path;

    I.moveCursorTo(locate('li').find('a').withAttr({ 'aria-label': 'Help' }));
    I.waitForElement('//div[contains(text(), \'PMM Logs\')]', 3);

    await I.usePlaywrightTo('download', async ({ page }) => {
      const [download] = await Promise.all([
        // Start waiting for the download
        page.waitForEvent('download'),
        // Perform the action that initiates download
        page.locator('//div[contains(text(), \'PMM Logs\')]').click(),
      ]);

      // Wait for the download process to complete
      path = await download.path();
    });

    await I.seeEntriesInZip(path, ['pmm-agent.yaml', 'pmm-managed.log', 'pmm-agent.log']);

    if ((await serverApi.getPmmVersion()).minor > 40) {
    /* PMM-T1830 alertmanager as been removed since 2.41.0 */
    /* note that 'alertmanager.ini',  'alertmanager.log' are still present in zip */
      await I.dontSeeEntriesInZip(path, ['alertmanager.yml', 'alertmanager.base.yml']);
    }
  },
);
