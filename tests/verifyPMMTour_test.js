const assert = require('assert');
const rulesAPI = require('./ia/pages/api/rulesAPI');

Feature('to go through new user Tour and verify it is shown once');

Scenario('PMM-T1272 Verify user is able to pass a PMM tour @nazarov123',
  async ({
    I, homePage, pmmTourPage, loginPage,
  }) => {
    const headers = ['Dashboards', 'PMM Dashboards', 'PMM Query Analytics', 'Explore', 'Alerting', 'Advisor checks', 'Configuration Panel'];

    await I.amOnPage(loginPage.url);
    loginPage.login();
    await I.executeScript(() => {
      localStorage.setItem('percona.tourTest', true);
      localStorage.removeItem('percona.showTour');
    });
    I.openNewTab();
    await I.amOnPage(homePage.landingUrl);
    I.waitForElement(pmmTourPage.fields.startTourButton);
    I.click(pmmTourPage.fields.startTourButton);
    headers.forEach(((headerName) => {
      I.seeElement(pmmTourPage.slideHeader(headerName));
      I.click(pmmTourPage.fields.nextSlideButton);
    }));
    I.seeElement(pmmTourPage.slideHeader('Server Admin'));
    I.click(pmmTourPage.fields.doneButton);

    await I.unAuthorize();
    await I.amOnPage(loginPage.url);
    loginPage.login();
    I.dontSee(pmmTourPage.fields.startTourButton);
    await I.executeScript(() => {
      localStorage.setItem('percona.tourTest', false);
      localStorage.setItem('percona.showTour', false);
    });
  });
