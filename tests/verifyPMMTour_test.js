const assert = require('assert');

Feature('to go through new user Tour and verify it is shown once');
Scenario('PMM-T1272 Verify user is able to pass a PMM tour @nazarov',
  async ({
    I, homePage, pmmTourPage, loginPage,
  }) => {
    const headers = ['Dashboards', 'PMM Dashboards', 'PMM Query Analytics', 'Explore', 'Alerting', 'Advisor checks', 'Configuration Panel'];

    await I.amOnPage(loginPage.url);
    loginPage.login();
    I.see(pmmTourPage.fields.startTourButton);
    I.click(pmmTourPage.fields.startTourButton);
    headers.forEach(((headerName) => {
      I.see(pmmTourPage.slideHeader(headerName));
      I.click(pmmTourPage.fields.nextSlideButton);
    }));
    I.see(pmmTourPage.slideHeader('Server Admin'));
    I.click(pmmTourPage.fields.doneButton);

    await I.unAuthorize();
    await I.amOnPage(loginPage.url);
    loginPage.login();
    I.dontSee(pmmTourPage.fields.startTourButton);
  });
