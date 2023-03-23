import { Page } from '@playwright/test';
import { AdvisorsPage } from './Advisors.page';

export class AdvisorInsights extends AdvisorsPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/roles';

  elements = {
    ...super.getAdvisorsElements(),
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
}
