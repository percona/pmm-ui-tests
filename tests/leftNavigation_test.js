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
    I.usePlaywrightTo('check browser version', async ({ browser }) => {
      // eslint-disable-next-line no-underscore-dangle,no-console
      console.log(`${browser._name} - `, await browser.version());
    });
    current.click();
    I.waitInUrl(current.path, 5);
  },
);
