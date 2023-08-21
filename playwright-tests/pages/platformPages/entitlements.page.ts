import { CommonPage } from '@pages/common.page';

export default class EntitlementsPage extends CommonPage {
  entitlementsUrl = 'graph/entitlements';
  entitlementsContainer = this.page.getByTestId('page-wrapper-entitlements');

  elements: any = {
    ...this.elements,
    row: this.entitlementsContainer.locator('//div[contains(@id, "collapse-label")]'),
  };

  messages: { [key: string]: string } = {
    ...this.messages,
    noEntitlements: 'No entitlements found',
  };
}
