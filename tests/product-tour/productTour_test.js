Feature('Pmm Product tour tests');

Before(async ({ I }) => {
  await I.stopMockingProductTourApi();
  await I.Authorize();
  await I.sendGetRequest('v1/users/me', { Authorization: `Basic ${await I.getAuth()}` });
});

Scenario('PMM-T1879 Verify that product tour dialog is displayed after check later button pressed. @grafana-pr', async ({ I, homePage }) => {
  await I.amOnPage('');
  await I.waitForElement(homePage.productTour.laterButton);
  await I.click(homePage.productTour.laterButton);
  await I.refreshPage();
  await I.waitForElement(homePage.productTour.productTourModal, 10);
}).config('Playwright', { waitForNavigation: 'load' });

Scenario('PMM-T1880 Verify that product tour dialog is displayed after closing @grafana-pr', async ({ I, homePage }) => {
  await I.amOnPage('');
  await I.waitForElement(homePage.productTour.closeButton);
  await I.click(homePage.productTour.closeButton);
  await I.refreshPage();
  await I.waitForElement(homePage.productTour.productTourModal, 10);
}).config('Playwright', { waitForNavigation: 'load' });

Scenario('PMM-T1881 Verify that product tour dialog contains all the components. @grafana-pr', async ({ I, homePage }) => {
  await I.amOnPage('');
  await I.waitForElement(homePage.productTour.startTourButton);
  await I.click(homePage.productTour.startTourButton);
  await homePage.productTour.verifyProductTourSteps();
  await I.waitForDetached(homePage.productTour.productTourModal);
}).config('Playwright', { waitForNavigation: 'load' });

Scenario('PMM-T1882 Verify that product tour dialog is not displayed after skipping @grafana-pr', async ({ I, homePage }) => {
  await I.enableProductTour();
  await I.amOnPage('');

  await I.waitForElement(homePage.productTour.skipButton);
  await I.click(homePage.productTour.skipButton);
  await I.stopMockingProductTourApi();

  await I.refreshPage();

  await I.waitForElement(homePage.elements.pageContent);
  await I.waitForDetached(homePage.productTour.productTourModal, 10);
}).config('Playwright', { waitForNavigation: 'load' });
