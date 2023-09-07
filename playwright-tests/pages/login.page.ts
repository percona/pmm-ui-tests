import { CommonPage } from '@pages/common.page';

export default class LoginPage extends CommonPage {
  readonly PAGE_PATH = 'graph/login';
  readonly PAGE_HEADING = 'Percona Monitoring and Management';

  elements: any = {
    ...this.elements,
    usernameInput: this.page.locator('//input[@name="user"]'),
    passwordInput: this.page.locator('//input[@name="password"]'),
    oktaLoginButton: this.page.locator('//*[@href="login/generic_oauth"]'),
    oktaLogin: {
      usernameInput: this.page.locator('//input[@name="username"]'),
      passwordInput: this.page.locator('//input[@name="password"]'),
      nextButton: this.page.locator('//*[@id="idp-discovery-submit"]'),
      signInButton: this.page.locator('//*[@id="okta-signin-submit"]'),
    },
  };

  /**
   * Opens given Page entering url into the address field.
   */
  public open = async () => {
    await this.openPageByPath(this.PAGE_PATH, this.PAGE_HEADING, this.PAGE_HEADING_LOCATOR);
  };

  oktaLogin = async (username: string, password: string) => {
    await this.elements.oktaLoginButton.click();
    await this.elements.oktaLogin.usernameInput.type(username);
    await this.elements.oktaLogin.nextButton.click();
    await this.elements.oktaLogin.passwordInput.type(password);
    await this.elements.oktaLogin.signInButton.click();
  };
}
