import { Page } from '@playwright/test';

export class OktaSignInPage {
  constructor(readonly page: Page) {}

  elements = {};

  fields = {
    username: this.page.locator('//*[@name="username"]'),
    password: this.page.locator('//*[@name="password"]'),
  };

  labels = {};

  buttons = {
    next: this.page.locator('//*[@id="idp-discovery-submit"]'),
    signIn: this.page.locator('//*[@id="okta-signin-submit"]'),
  };

  messages = {};

  links = {};
}
