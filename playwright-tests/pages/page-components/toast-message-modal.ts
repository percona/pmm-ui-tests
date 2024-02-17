import { Page, expect } from '@playwright/test';
import Wait from '@helpers/enums/wait';

export default class ToastMessage {
  constructor(readonly page: Page) { }

  private toastSuccess = this.page.locator('//div[@data-testid="data-testid Alert success" or @aria-label="Alert success"]');
  private toastWarning = this.page.locator('//div[@data-testid="data-testid Alert warning" or @aria-label="Alert warning"]');
  private toastError = this.page.locator('//div[@data-testid="data-testid Alert error" or @aria-label="Alert error"]');
  private messageText = this.page.locator('.page-alert-list div[data-testid^="data-testid Alert"] div:has(div[id])');
  private closeButton = this.page.locator('.page-alert-list button');

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

  async waitForSuccess(timeout?: number) {
    await this.messageText.waitFor({ state: 'visible', timeout: timeout || Wait.ToastMessage });
    await expect(this.toastSuccess, `Verify found message is success: "${await this.messageText.textContent()}"`)
      .toBeVisible();
    await this.closeButton.click();
    await this.messageText.waitFor({ state: 'detached', timeout: Wait.TwoSeconds });
  }

  waitForError = async (timeout?: number) => {
    await this.messageText.waitFor({ state: 'visible', timeout: timeout || Wait.ToastMessage });
    await expect(this.toastError, `Verify found message is not an error: "${await this.messageText.textContent()}"`)
      .toBeVisible();
    await this.closeButton.click();
    await this.messageText.waitFor({ state: 'detached', timeout: Wait.TwoSeconds });
  };

  catchError = async (timeout?: number) => {
    let toastDisplayed = false;
    try {
      await this.messageText.waitFor({ state: 'visible', timeout: timeout || Wait.ToastMessage })
        .then(() => { toastDisplayed = true; });
    } catch (TimeoutException) {
      // normal flow that toast should not appear
    }
    if (toastDisplayed) {
      await expect(this.toastSuccess, `Verify found message is not an error: "${await this.messageText.textContent()}"`)
        .toBeVisible({ timeout: 1 });
    }
  };
}
