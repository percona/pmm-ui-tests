import { CommonPage } from '@pages/common.page';
import { Locator } from '@playwright/test';

export default class LoginPage extends CommonPage {
  readonly PAGE_PATH = 'graph/login';
  readonly PAGE_HEADING = 'Percona Monitoring and Management';

  elements: any = {
    ...this.elements,
    headingLocator: this.page.locator('//h1'),
    oktaLogin: {
      usernameInput: this.page.locator('//*[@name="username"]'),
      passwordInput: this.page.locator('//*[@name="password"]'),
      nextButton: this.page.locator('//*[@id="idp-discovery-submit"]'),
      signInButton: this.page.locator('//*[@id="okta-signin-submit"]'),
    },
  };

  fields = {
    username: this.page.locator('//*[@name="username"]'),
    password: this.page.locator('//*[@name="password"]'),
  };

  buttons = {
    oktaLogin: this.page.locator('//*[@href="login/generic_oauth"]'),
  };

  /**
   * Opens given Page entering url into the address field.
   */
  public open = async () => {
    await this.openPageByPath(this.PAGE_PATH, this.PAGE_HEADING, this.elements.headingLocator as Locator);
  };

  oktaLogin = async (username: string, password: string) => {
    await this.buttons.oktaLogin.click();
    await this.elements.oktaLogin.usernameInput.type(username);
    await this.elements.oktaLogin.nextButton.click();
    await this.elements.oktaLogin.passwordInput.type(password);
    await this.elements.oktaLogin.signInButton.click();
  };
}
