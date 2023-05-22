import { Page } from '@playwright/test';
import { AdvisorsPage } from './Advisors.page';

export class DevelopmentAdvisors extends AdvisorsPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/advisors/development';

  elements = {
    ...super.getAdvisorsElements(),
  };

  fields = {
    ...super.getAdvisorsFields(),
  };

  labels = {
    ...super.getAdvisorsLabels(),
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
