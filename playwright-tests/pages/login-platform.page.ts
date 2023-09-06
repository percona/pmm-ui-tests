import { CommonPage } from '@pages/common.page';

export default class LoginPlatformPage extends CommonPage {
  readonly PAGE_PATH = 'https://id-dev.percona.com/signin';
  readonly PAGE_HEADING = 'Sign in to Percona Platform';

  elements: any = {
    usernameInput: this.page.locator('//input[@name="username"]'),
    passwordInput: this.page.locator('//input[@name="password"]'),
    nextButton: this.page.locator('//input[@id="idp-discovery-submit"]'),
    signInButton: this.page.locator('//input[@id="okta-signin-submit"]'),
  };

  login = async (username: string, password: string) => {
    await this.elements.usernameInput.type(username);
    await this.elements.nextButton.click();
    await this.elements.passwordInput.type(password);
    await this.elements.signInButton.click();
  };
}
