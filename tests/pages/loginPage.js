const { I, homePage } = inject();

module.exports = {
  url: 'graph/login',
  fields: {
    loginInput: '//input[@name="user"]',
    passwordInput: '//input[@name="password"]',
    loginButton: '//button[@type="submit"]',
    skipButton: '//button[span[text()="Skip"]]',
  },
  messages: {
    loginSuccess: 'Logged in',
  },

  // introducing methods
  async login(username = 'admin', password = process.env.ADMIN_PASSWORD) {
    I.seeElement(this.fields.loginInput);
    I.fillField(this.fields.loginInput, username);
    I.seeElement(this.fields.passwordInput);
    I.fillField(this.fields.passwordInput, password);
    I.click(this.fields.loginButton);

    // BUG: there is no message on success for changed password
    // eslint-disable-next-line no-undef
    tryTo(() => I.verifyPopUpMessage(this.messages.loginSuccess, 5));

    if ((await I.grabCurrentUrl()).includes(this.url)) {
      I.seeElement(this.fields.skipButton);
      I.click(this.fields.skipButton);
    }

    I.waitInUrl(homePage.landingUrl);
  },

};
