import { Page } from '@playwright/test';

export default class AdvisorsMenu {
  constructor(readonly page: Page) { }

  private container = this.page.locator('//ul[@aria-label="Advisors"]');

  elements = {};

  fields = {};

  labels = {};

  buttons = {
    advisorInsights: this.container.locator('//li[@data-key="advisors-insights"]'),
    securityAdvisors: this.container.locator('//li[@data-key="advisors-security"]'),
    configurationAdvisors: this.container.locator('//li[@data-key="advisors-configuration"]')
  };

  messages = {};

  links = {};

}
