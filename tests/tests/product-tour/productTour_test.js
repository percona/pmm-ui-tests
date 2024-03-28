Feature('Pmm Product tour tests');

Before(async ({ I }) => {
  await I.stopMockingProductTourApi();
  await I.Authorize();
  await I.sendGetRequest('v1/user', { Authorization: `Basic ${await I.getAuth()}` });
});

Scenario('PMM-T Verify that product tour dialog is displayed after check later button pressed. @testProductTour2 @grafana-pr', async ({ I, homePage }) => {
  await I.amOnPage('');
  await I.waitForElement(homePage.productTour.laterButton);
  await I.click(homePage.productTour.laterButton);
  await I.setLoginCookies();
  await I.refreshPage();
  await I.setLoginCookies();
  await I.waitForElement(homePage.productTour.productTourModal, 10);
});

Scenario('PMM-T Verify that product tour dialog is displayed after closing @testProductTour @grafana-pr', async ({ I, homePage }) => {
  await I.amOnPage('');
  await I.waitForElement(homePage.productTour.closeButton);
  await I.click(homePage.productTour.closeButton);
  await I.refreshPage();
  await I.waitForElement(homePage.productTour.productTourModal, 10);
});

Scenario('PMM-T Verify that product tour dialog works as expected. @testProductTour @grafana-pr', async ({ I, homePage }) => {
  await I.amOnPage('');

  await I.waitForElement(homePage.productTour.startTourButton);
  await I.click(homePage.productTour.startTourButton);
  await homePage.productTour.verifyProductTourSteps();
  await I.waitForDetached(homePage.productTour.productTourModal);
});

Scenario('PMM-T Verify that product tour dialog is not displayed after skipping @testProductTour @grafana-pr', async ({ I, homePage }) => {
  await I.enableProductTour();
  await I.amOnPage('');

  await I.waitForElement(homePage.productTour.skipButton);
  await I.click(homePage.productTour.skipButton);
  await I.stopMockingProductTourApi();

  await I.refreshPage();

  await I.waitForElement(homePage.elements.pageContent);
  await I.waitForDetached(homePage.productTour.productTourModal, 10);
});
