import { Page, expect } from '@playwright/test';
import Wait from '@helpers/enums/wait';

export default class ToastMessage {
  constructor(readonly page: Page) { }

  toastSuccess = this.page.locator('//div[@data-testid="data-testid Alert success" or @aria-label="Alert success"]');
  toastWarning = this.page.locator('//div[@data-testid="data-testid Alert warning" or @aria-label="Alert warning"]');
  toastError = this.page.locator('//div[@data-testid="data-testid Alert error" or @aria-label="Alert error"]');
  messageText = this.page.locator('.page-alert-list div[data-testid^="data-testid Alert"] div[id]');
  closeButton = this.page.locator('.page-alert-list button');

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