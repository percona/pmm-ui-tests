import { Page, expect } from '@playwright/test';
import { OktaSignInPage } from '@pages/OktaSignIn.page';
import { CommonPage } from '@pages/Common.page';
import Duration from '@tests/helpers/Duration';

export class SignInPage extends CommonPage {
  constructor(readonly page: Page) {
    super(page);
  }

  elements = {
    ...super.getElements(),
  };

  fields = {
    ...super.getFields(),
    username: this.page.locator('//*[@name="username" or @name="user"]'),
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
    await this.sideMenu.elements.home.waitFor({ state: 'visible', timeout: Duration.OneMinute });
  };

  waitForOktaLogin = async (timeout: Duration = Duration.OneMinute) => {
    let retries = 0;
    while (!(await this.buttons.oktaLogin.isVisible())) {
      await this.page.reload();
      await this.page.waitForTimeout(Duration.TenSeconds);
      retries++;
      if (retries > timeout / Duration.TenSeconds) {
        expect(false, 'Okta login button was not displayed in requested time.').toBeTruthy();
      }
    }
  }
}
