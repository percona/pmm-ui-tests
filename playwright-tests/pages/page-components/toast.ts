import { Page, expect, Locator } from '@playwright/test';
import config from '@root/playwright.config';

export class Toast {
  constructor(readonly page: Page) { }

  toast = this.page.locator('//div[contains(@data-testid, "Alert") or contains(@aria-label, "Alert")]');
  toastSuccess = this.page.locator('//div[@data-testid="data-testid Alert success" or @aria-label="Alert success"]');
  toastWarning = this.page.locator('//div[@data-testid="data-testid Alert warning" or @aria-label="Alert warning"]');
  toastError = this.page.locator('//div[@data-testid="data-testid Alert error" or @aria-label="Alert error"]');
  closeButton = (selectedToast: Locator) => selectedToast.locator('//*[@aria-label="Close alert" or @type="button"]');

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

  }

  checkToastMessage = async (
    message: string,
    options?: { timeout?: number; variant?: 'success' | 'warning' | 'error', assertionTimeout?: number },
  ) => {
    let selectedToast: Locator = this.selectToast(options?.variant);

    await selectedToast.waitFor({ state: 'visible', timeout: options?.timeout || 30000 });
    await expect(selectedToast).toHaveText(message, { timeout: options?.assertionTimeout || config.expect?.timeout });
    await this.closeButton(selectedToast).click();
    await selectedToast.waitFor({ state: 'detached' });
  };

  checkToastMessageContains = async (
    message: string,
    options?: { timeout?: number; variant?: 'success' | 'warning' | 'error', assertionTimeout?: number },
  ) => {
    let selectedToast: Locator = this.selectToast(options?.variant);

    await selectedToast.waitFor({ state: 'visible', timeout: options?.timeout });
    await expect(selectedToast).toContainText(message, { timeout: options?.assertionTimeout || config.expect?.timeout });
    await this.closeButton(selectedToast).click();
    await selectedToast.waitFor({ state: 'detached' });
  };
}