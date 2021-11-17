const { leftNavMenu } = inject();

const sidebar = new DataTable(['name', 'locator', 'path', 'click']);

const parse = (obj) => {
  if (obj !== null && typeof obj == 'object') {
    if ('path' in obj && 'click' in obj
      // excludes top level clickable icon
      && 'label' in obj) {
      sidebar.add([obj.label, obj.locator, obj.path, obj.click]);
    }

    Object.values(obj).forEach((value) => {
      // key is either an array index or object key
      parse(value);
    });
  }
};

parse(leftNavMenu);

Feature('Left Navigation menu tests');

Before(async ({ I, homePage }) => {
  await I.Authorize();
  await homePage.open();
});

Data(sidebar).Scenario(
  'PMM-T433 - Verify menu items on Grafana sidebar @nightly @menu',
  async ({ I, current }) => {
    I.seeElementInDOM(current.locator);
  },
);

Data(sidebar).Scenario(
  'PMM-T591 - Verify menu items on Grafana sidebar redirects to correct page @nightly @menu',
  async ({ I, current }) => {
    current.click();
    I.seeInCurrentUrl(current.path);
  },
);