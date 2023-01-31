/* eslint-disable lines-between-class-members */
import { Page } from '@playwright/test';
import { CommonPage } from './Common.page';

export class OktaSignInPage {
  // eslint-disable-next-line no-empty-function
  constructor(readonly page: Page) {
  }

  elements = {
  }

  fields = {
    username: this.page.locator('//*[@name="username"]'),
    password: this.page.locator('//*[@name="password"]')
  }

  labels = {
  }

  buttons = {
    next: this.page.locator('//*[@id="idp-discovery-submit"]'),
    signIn: this.page.locator('//*[@id="okta-signin-submit"]')
  }

  messages = {
  }

  links = {
  }
}
