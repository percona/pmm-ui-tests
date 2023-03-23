import { Page } from '@playwright/test';
import { AdvisorsPage } from './Advisors.page';

export class ConfigurationAdvisors extends AdvisorsPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/advisors/configuration';

  elements = {
    ...super.getAdvisorsElements(),
    configurationVersions: this.page.getByText('Configuration Version'),
  };

  fields = {
    ...super.getAdvisorsFields(),
  };

  labels = {
    ...super.getAdvisorsLabels(),
  };

  buttons = {
    ...super.getAdvisorsButtons(),
    runAdvisor: (advisorName: string) => this.page.locator(`//*[text()="${advisorName}"]/parent::*//button[@data-testid="check-table-loader-button-run"]`),
    disableAdvisor: (advisorName: string) => this.page.locator(`//*[text()="${advisorName}"]/parent::*//button[@data-testid="check-table-loader-button"]`),
    editAdvisor: (advisorName: string) => this.page.locator(`//*[text()="${advisorName}"]/parent::*//button[@title="Change check interval"]`)
  };

  messages = {
    ...super.getAdvisorsMessages(),
    advisorRunningBackground: (advisorName: string) => `${advisorName} check started running in the background`
  };

  links = {
    ...super.getAdvisorsLinks(),
  };
}
