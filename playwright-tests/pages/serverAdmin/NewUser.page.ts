import { Page } from '@playwright/test';
import { CommonPage } from '../Common.page';

export class NewUserPage extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/admin/users/create'

  elements = {
    ...super.getElements(),
  };

  fields = {
    ...super.getFields(),
    name: this.page.locator('//*[@id="name-input"]'),
    email: this.page.locator('//*[@id="email-input"]'),
    username: this.page.locator('//*[@id="username-input"]'),
    password: this.page.locator('//*[@id="password-input"]'),
  };

  labels = {
    ...super.getLabels(),
  };

  buttons = {
    ...super.getButtons(),
    createUser: this.page.locator('//*[@type="submit"]')
  };

  messages = {
    ...super.getMessages(),
    userCreated: 'User created',
  };

  links = {
    ...super.getLinks(),
  };

  fillUserDetails = async (name: string, email: string, username: string, password: string) => {
    await this.fields.name.type(name);
    await this.fields.email.type(email);
    await this.fields.username.type(username);
    await this.fields.password.type(password);
  };

  createUser = async (name: string, email: string, username: string, password: string) => {
    await this.fillUserDetails(name, email, username, password);
    await this.buttons.createUser.click();
    await this.toast.checkToastMessage(this.messages.userCreated, { variant: 'success' });
  };
}


