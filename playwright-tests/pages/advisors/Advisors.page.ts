import { Page } from '@playwright/test';
import { CommonPage } from '../Common.page';
import AdvisorsTable from '@tests/components/advisors/advisorsTable';

export class AdvisorsPage extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  advisorsTable = new AdvisorsTable(this.page);
  private advisorsElements = {
    ...super.getElements(),
    advisorRow: (advisorName: string) => this.page.locator(`//td[text()="${advisorName}"]//ancestor::tr`),
    advisorsCategory: (categoryName: string) => this.page.locator(`//*[text()="${categoryName}"]//ancestor::*[@data-testid="collapse-clickable"]`),
    advisorsCategoryCollapse: this.page.getByTestId('collapse-clickable'),
  };

  private advisorsFields = {
    ...super.getFields(),
  };

  private advisorsLabels = {
    ...super.getLabels(),
    pgsqlVersion: 'postgresql_version_check',
    pgsqlVersionDescription: 'Check if PostgreSQL version is EOL',
  };

  private advisorsButtons = {
    ...super.getButtons(),
    runChecks: this.page.locator('//*[text()="Run Checks"]/parent::button'),
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
    advisorsRunning: 'All checks started running in the background',
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

  getNumberOfAllAvailableAdvisors = async (): Promise<number> => {
    let numberOfAdvisors: number = 0;
    await this.advisorsButtons.configurationAdvisors.click();
    await this.openAllCategoryCollapseElements();
    numberOfAdvisors = await this.advisorsTable.elements.row.count();

    await this.advisorsButtons.securityAdvisors.click();
    await this.openAllCategoryCollapseElements();
    numberOfAdvisors = numberOfAdvisors + await this.advisorsTable.elements.row.count();

    return numberOfAdvisors;
  }

  openAllCategoryCollapseElements = async () => {
    await this.advisorsElements.advisorsCategoryCollapse.first().waitFor({ state: 'visible' });
    const numberOfElements = await this.advisorsElements.advisorsCategoryCollapse.count();
    for (let i = 0; i < numberOfElements; i++) {
      await this.advisorsElements.advisorsCategoryCollapse.nth(i).click();
    }
  }
}
