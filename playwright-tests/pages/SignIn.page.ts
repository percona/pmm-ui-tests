/* eslint-disable lines-between-class-members */
import { Page } from '@playwright/test';
import { OktaSignInPage } from './OktaSignIn.page';
import { CommonPage } from './pmmSettings/Common.page';

export class SignInPage extends CommonPage {
  // eslint-disable-next-line no-empty-function
  constructor(readonly page: Page) {
    super(page)
  }

  elements = {
    ...super.getElements(),
  }

  fields = {
    ...super.fields,
    username: this.page.locator('//*[@name="username"]'),
    password: this.page.locator('//*[@name="password"]')
  }

  labels = {
    ...super.labels,
  }

  buttons = {
    ...super.buttons,
    oktaLogin: this.page.locator('//*[@href="login/generic_oauth"]'),
  }

  messages = {
    ...super.messages,
  }

  links = {
    ...super.links,
  }





  oktaLogin = async (username: string, password: string) => {
    const oktaSignInPage = new OktaSignInPage(this.page);

    await this.buttons.oktaLogin.click()
    await oktaSignInPage.fields.username.type(username);
    await oktaSignInPage.buttons.next.click();
    await oktaSignInPage.fields.password.type(password);
    await oktaSignInPage.buttons.signIn.click();
  };
}
