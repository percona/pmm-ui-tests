import { CommonPage } from '@pages/common.page';
import LoginPlatformPage from '@pages/login-platform.page';

export default class LoginPage extends CommonPage {
  readonly PAGE_PATH = 'graph/login';
  readonly PAGE_HEADING = 'Percona Monitoring and Management';

  elements: any = {
    ...this.elements,
    headingLocator: this.page.locator('//h1'),
    username: this.page.locator('//input[@name="username"]'),
    password: this.page.locator('//input[@name="password"]'),
    signInWithPerconaAccountButton: this.page.locator('//*[@href="login/generic_oauth"]'),
  };

  /**
   * Opens given Page entering url into the address field.
   */
  public open = async () => {
    await this.openPageByPath(this.PAGE_PATH, this.PAGE_HEADING, this.PAGE_HEADING_LOCATOR);
  };

  signInWithPerconaAccount = async (username: string, password: string) => {
    await this.elements.signInWithPerconaAccountButton.click();
    await new LoginPlatformPage(this.page).login(username, password);
    await this.toastMessage.catchError();
  };
}
