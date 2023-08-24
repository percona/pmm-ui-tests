import { Page, expect } from '@playwright/test';
import Wait from '@helpers/enums/wait';

export default class ToastMessage {
  constructor(readonly page: Page) { }

  toast = this.page.locator('//div[contains(@data-testid, "Alert") or contains(@aria-label, "Alert")]');
  toastSuccess = this.page.locator('//div[@data-testid="data-testid Alert success" or @aria-label="Alert success"]');
  toastWarning = this.page.locator('//div[@data-testid="data-testid Alert warning" or @aria-label="Alert warning"]');
  toastError = this.page.locator('//div[@data-testid="data-testid Alert error" or @aria-label="Alert error"]');

  messageText = this.page.locator('.page-alert-list div[data-testid^="data-testid Alert"] > div');
  closeButton = this.page.locator('.page-alert-list button');

  // closeButton = (selectedToast: Locator) => selectedToast.locator('//*[@aria-label="Close alert" or @type="button"]');

  private selectToast = (variant?: string) => {
    switch (variant) {
      case 'success':
        return this.toastSuccess;
      case 'warning':
        return this.toastWarning;
      case 'error':
        return this.toastError;
      default:
        return this.toast;
    }
  };

  waitForMessage = async (message: string, timeout?: number) => {
    await this.messageText.waitFor({ state: 'visible', timeout: timeout || Wait.ToastMessage });
    await expect(this.messageText, `Waiting for Toast message with text "${message}"`)
      .toHaveText(message, { timeout: Wait.OneSecond });
    await this.closeButton.click();
    await this.messageText.waitFor({ state: 'detached', timeout: Wait.TwoSeconds });
  };

  waitForMessageContains = async (message: string, timeout?: number) => {
    await this.messageText.waitFor({ state: 'visible', timeout: timeout || Wait.ToastMessage });
    await expect(this.messageText, `Waiting for Toast message containing "${message}"`)
      .toContainText(message, { timeout: Wait.OneSecond });
    await this.closeButton.click();
    await this.messageText.waitFor({ state: 'detached', timeout: Wait.TwoSeconds });
  };
}
