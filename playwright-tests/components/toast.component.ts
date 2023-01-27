/* eslint-disable lines-between-class-members, no-empty-function */
import { Page, expect } from '@playwright/test';
import Duration from '../helpers/Duration';

export class Toast {
  constructor(readonly page: Page) {}

  toast = this.page.locator('//*[contains(@data-testid, "Alert")]');
  closeButton = this.toast.locator('//*[@aria-label="Close alert"]');
  
  checkToastMessage = async (message: string, timeout: Duration = Duration.OneMinute) => {
    await this.toast.waitFor({ state: 'visible', timeout });
    await expect(this.toast).toHaveText(message);
    await this.closeButton.click();
    await this.toast.waitFor({ state: 'detached' });
  }
}
