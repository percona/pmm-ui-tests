import { Page } from '@playwright/test';
import { CommonPage } from '../Common.page';

export class AdvisorsPage extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  private advisorsElements = {
    ...super.getElements(),
    advisorRow: (advisorName: string) => this.page.locator(`//td[text()="${advisorName}"]//ancestor::tr`)
  };

  private advisorsFields = {
    ...super.getFields(),
  };

  private advisorsLabels = {
    ...super.getLabels(),
  };

  private advisorsButtons = {
    ...super.getButtons(),
    connectToPlatform: this.page.locator('//*[text()="Connect to Percona Platform"]/parent::*'),
    advisorInsights: this.page.locator('//*[@aria-label="Tab Advisor Insights"]'),
    securityAdvisors: this.page.locator('//*[@aria-label="Tab Security Advisors"]'),
    configurationAdvisors: this.page.locator('//*[@aria-label="Tab Configuration Advisors"]'),
    runAdvisor: (advisorName: string) => this.advisorsElements.advisorRow(advisorName).locator('//button[contains(@data-testid, "button-run")]'),
    disableAdvisor: (advisorName: string) => this.advisorsElements.advisorRow(advisorName).locator('//button[contains(@data-testid, "loader-button")]'),
    setAdvisorInterval: (advisorName: string) => this.advisorsElements.advisorRow(advisorName).locator('//button[@title="Change check interval"]'),
  };

  private advisorsMessages = {
    ...super.getMessages(),
  };

  private advisorsLinks = {
    ...super.getLinks(),
  };

  protected getAdvisorsElements() {
    return this.advisorsElements;
  }

  protected getAdvisorsFields() {
    return this.advisorsFields;
  }

  protected getAdvisorsLabels() {
    return this.advisorsLabels;
  }

  protected getAdvisorsButtons() {
    return this.advisorsButtons;
  }

  protected getAdvisorsMessages() {
    return this.advisorsMessages;
  }

  protected getAdvisorsLinks() {
    return this.advisorsLinks;
  }
}
