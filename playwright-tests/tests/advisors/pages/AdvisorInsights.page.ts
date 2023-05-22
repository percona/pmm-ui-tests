import { Page, expect } from '@playwright/test';
import Duration from '@tests/helpers/Duration';
import { AdvisorsPage } from './Advisors.page';
import InsightsTable from '@tests/components/advisors/insightsTable';
import FailedChecksTable from '@tests/components/advisors/failedChecksTable';

export enum FailedAdvisorType {
  Warning = 'Warning',
  Error = 'Error',
  Notice = 'Notice',
}

export class AdvisorInsights extends AdvisorsPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/advisors/insights';
  insightsTable = new InsightsTable(this.page);
  failedChecksTable = new FailedChecksTable(this.page);

  elements = {
    ...super.getAdvisorsElements(),
    failedAdvisorRow: (advisorName: string) => this.page.locator(`//*[text()="${advisorName}"]//ancestor::tr`),
    failedAdvisorRowByServiceName: (serviceName: string) => this.page.locator(`//*[contains(text(), "${serviceName}")]//ancestor::tr`),
    selectService: (serviceName: string) => this.page.locator(`//*[contains(text(), "${serviceName}")]/parent::*`),
    failedAdvisorsForServiceByType: (serviceName: string, advisorType: FailedAdvisorType) => this.page
      .locator(`//td[contains(text(), '${serviceName}')]//ancestor::tr//span[text()="${advisorType}"]//ancestor::li`)
  };

  fields = {
    ...super.getAdvisorsFields(),
  };

  labels = {
    ...super.getAdvisorsLabels(),
    create: 'Create',
  };

  buttons = {
    ...super.getAdvisorsButtons(),
  };

  messages = {
    ...super.getAdvisorsMessages(),
  };

  links = {
    ...super.getAdvisorsLinks(),
  };

  verifyFailedAdvisorsForServiceAndType = async (serviceName: string, advisorType: FailedAdvisorType, count: number, timeout?: Duration) => {
    await this.waitForFailedAdvisorDisplayed(serviceName, advisorType, timeout);
    const failedAdvisor = (await this.elements.failedAdvisorsForServiceByType(serviceName, advisorType).textContent()) || ''
    expect(parseInt(failedAdvisor.replace(/\D/g, ''))).toEqual(count);
  }

  waitForServiceDisplayed = async (advisorName: string, timeout: number = Duration.OneMinute) => {
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, timeout / 10));

      if (await this.elements.selectService(advisorName).isVisible()) break

      if (i === 9) {
        throw new Error(`Advisor ${advisorName} is not in the list of the failed Advisors`);
      }

      await this.page.reload()
    }
  };

  waitForFailedAdvisorDisplayed = async (serviceName: string, type: FailedAdvisorType, timeout: number = Duration.OneMinute) => {
    for (let i = 0; i < 20; i++) {
      try {
        await this.elements.failedAdvisorsForServiceByType(serviceName, type).waitFor({ state: 'visible', timeout: Duration.FiveSeconds });
        break;
      } catch (e) { }

      await new Promise((r) => setTimeout(r, timeout / 10));

      if (i === 9) {
        throw new Error(`Advisor type ${type} for the service ${serviceName} is not displayed in the list of the failed Advisors`);
      }

      await this.page.reload()
    }
  };
}
