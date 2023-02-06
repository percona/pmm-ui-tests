import { Page } from '@playwright/test';
import { CommonPage } from '@pages/common.page';

export default class EntitlementsPage extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  entitlementsUrl = 'graph/entitlements';
  entitlementsContainer = this.page.getByTestId('page-wrapper-entitlements');

  elements = {
    ...super.getElements(),
    row: this.entitlementsContainer.locator('//div[contains(@id, "collapse-label")]'),
  };

  fields = {
    ...super.getFields(),
  };

  labels = {
    ...super.getLabels(),
  };

  buttons = {
    ...super.getButtons(),
  };

  messages = {
    ...super.getMessages(),
    noEntitlements: 'No entitlements found',
  };

  links = {
    ...super.getLinks(),
  };
}
