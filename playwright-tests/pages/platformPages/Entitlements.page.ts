import { Page } from '@playwright/test';
import { CommonPage } from '../Common.page';

export default class EntitlementsPage extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  entitlementsUrl = 'graph/entitlements';
  entitlementsContainer = this.page.getByTestId('page-wrapper-entitlements');

  elements = {
    ...super.getElements(),
    row: this.entitlementsContainer.locator('//div[contains(@id, "collapse-label")]'),
    noData: this.entitlementsContainer.getByTestId('page-no-data'),
  }

  fields = {
    ...super.fields,
  }
  
  labels = {
    ...super.labels,
  }

  buttons = {
    ...super.buttons,
  }

  messages = {
    ...super.messages,
    noEntitlements: 'No entitlements found',
  }

  links = {
    ...super.links,
  }
}