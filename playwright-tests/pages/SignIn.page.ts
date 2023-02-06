import { Page } from '@playwright/test';
import { OktaSignInPage } from '@pages/oktaSignIn.page';
import { CommonPage } from '@pages/common.page';

export class SignInPage extends CommonPage {
  constructor(readonly page: Page) {
    super(page);
  }

  elements = {
    ...super.getElements(),
  };

  fields = {
    ...super.getFields(),
    username: this.page.locator('//*[@name="username"]'),
    password: this.page.locator('//*[@name="password"]'),
  };

  labels = {
    ...super.getLabels(),
  };

  buttons = {
    ...super.getButtons(),
    oktaLogin: this.page.locator('//*[@href="login/generic_oauth"]'),
  };

  messages = {
    ...super.getMessages(),
  };

  links = {
    ...super.getLinks(),
  };

  oktaLogin = async (username: string, password: string) => {
    const oktaSignInPage = new OktaSignInPage(this.page);

    await this.buttons.oktaLogin.click();
    await oktaSignInPage.fields.username.type(username);
    await oktaSignInPage.buttons.next.click();
    await oktaSignInPage.fields.password.type(password);
    await oktaSignInPage.buttons.signIn.click();
  };
}
