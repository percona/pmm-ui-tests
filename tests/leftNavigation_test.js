const { leftNavMenu } = inject();

const sidebar = new DataTable(['locator', 'path', 'click']);

// parse leftNavMenu;  path === '#' should be skipped
sidebar.add([leftNavMenu.search.locator, leftNavMenu.search.path, leftNavMenu.search.click]);

Feature('Left Navigation menu tests');

Before(async ({ I, homePage }) => {
  await I.Authorize();
  await homePage.open();
});

Data(sidebar).Scenario(
  'PMM-T433 - Verify menu items on Grafana sidebar @nightly @menu',
  async ({ I, current }) => {
    I.seeElementExists(current.locator);
  },
);

Data(sidebar).Scenario(
  'PMM-T591 - Verify menu items on Grafana sidebar redirects to correct page @nightly @menu',
  async ({ I, current }) => {
    await current.click();
    I.seeInCurrentUrl(current.path);
  },
);