import { CommonPage } from '@pages/common.page';
import { expect } from '@helpers/test-helper';
import Wait from '@helpers/enums/wait';

export default class AdvancedSettingsPage extends CommonPage {
  PAGE_PATH = 'graph/settings/advanced-settings';
  PAGE_HEADING = 'Advanced Settings';
  PAGE_HEADING_LOCATOR = this.page.getByTestId('check-intervals-label');

  elements = {
    accessControlToggle: this.page.locator('//*[@data-testid="access-control"]//label'),
    applyChangesButton: this.page.getByTestId('advanced-button'),
  };

  /**
   * Opens given Page entering url into the address field.
   */
  public open = async () => {
    await this.openPageByPath(this.PAGE_PATH, this.PAGE_HEADING, this.PAGE_HEADING_LOCATOR);
  };

  switchAccessControl = async (state: 'on' | 'off') => {
    await this.elements.accessControlToggle.click({ trial: true, timeout: Wait.TenSeconds });
    const isToggled = await this.elements.accessControlToggle.isChecked();
    if ((isToggled && state === 'on') || (!isToggled && state === 'off')) {
      console.log(`Access Control is already switched ${state}`);
      return;
    }
    await this.elements.accessControlToggle.click({ force: true });
    if (state === 'on') {
      await expect(this.elements.accessControlToggle).toBeChecked();
    } else {
      await expect(this.elements.accessControlToggle).not.toBeChecked();
    }
    await this.elements.applyChangesButton.click();
    await this.toastMessage.waitForSuccess();
  };
}
