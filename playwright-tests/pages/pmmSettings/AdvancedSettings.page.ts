import { Page } from '@playwright/test';
import { CommonPage } from '@pages/Common.page';

export default class AdvancedSettings extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/settings/advanced-settings';

  elements = {
    ...super.getElements(),
  };

  fields = {
    ...super.getFields(),
    accessControl: this.page.locator('//*[@data-testid="access-control"]//label'),
  };

  labels = {
    ...super.getLabels(),
  };

  buttons = {
    ...super.getButtons(),
    applyChanges: this.page.getByTestId('advanced-button'),
  };

  messages = {
    ...super.getMessages(),
  };

  links = {
    ...super.getLinks(),
  };
}