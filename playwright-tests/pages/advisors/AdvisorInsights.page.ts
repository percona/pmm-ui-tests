import { Page } from '@playwright/test';
import Duration from '@tests/helpers/Duration';
import { AdvisorsPage } from './Advisors.page';

export class AdvisorInsights extends AdvisorsPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/roles';

  elements = {
    ...super.getAdvisorsElements(),
    failedAdvisorRow: (advisorName: string) => this.page.locator(`//*[contains(text(), "${advisorName}")]//ancestor::tr`),
    selectService: (serviceName: string) => this.page.locator(`//*[contains(text(), "${serviceName}")]/parent::*`),
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
}
