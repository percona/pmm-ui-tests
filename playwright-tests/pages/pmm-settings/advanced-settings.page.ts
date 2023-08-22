import { CommonPage } from '@pages/common.page';

export default class AdvancedSettingsPage extends CommonPage {
  url = 'graph/settings/advanced-settings';

  fields = {
    accessControl: this.page.locator('//*[@data-testid="access-control"]//label'),
  };

  buttons = {
    applyChanges: this.page.getByTestId('advanced-button'),
  };
}
