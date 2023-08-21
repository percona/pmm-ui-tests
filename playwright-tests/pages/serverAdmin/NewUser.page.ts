import { CommonPage } from '../common.page';

export class NewUserPage extends CommonPage {
  url = 'graph/admin/users/create';

  fields = {
    name: this.page.locator('//*[@id="name-input"]'),
    email: this.page.locator('//*[@id="email-input"]'),
    username: this.page.locator('//*[@id="username-input"]'),
    password: this.page.locator('//*[@id="password-input"]'),
  };

  buttons = {
    createUser: this.page.locator('//*[@type="submit"]')
  };

  messages: any = {
    ...this.messages,
    userCreated: 'User created',
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
