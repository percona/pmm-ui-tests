import { Page, expect, Locator } from '@playwright/test';
import Duration from '@helpers/duration';

export class Toast {
  constructor(readonly page: Page) {}

  toast = this.page.locator('//div[contains(@data-testid, "Alert") or contains(@aria-label, "Alert")]');
  toastSuccess = this.page.locator('//div[@data-testid="data-testid Alert success" or @aria-label="Alert success"]');
  toastWarning = this.page.locator('//div[@data-testid="data-testid Alert warning" or @aria-label="Alert warning"]');
  toastError = this.page.locator('//div[@data-testid="data-testid Alert error" or @aria-label="Alert error"]');
  closeButton = (selectedToast: Locator) => selectedToast.locator('//*[@aria-label="Close alert" or @type="button"]');

  checkToastMessage = async (
    message: string,
    options?: { timeout?: Duration.OneMinute; variant?: 'success' | 'warning' | 'error' },
  ) => {
    let selectedToast: Locator;
    switch (options?.variant) {
      case 'success':
        selectedToast = this.toastSuccess;
        break;
      case 'warning':
        selectedToast = this.toastWarning;
        break;
      case 'error':
        selectedToast = this.toastError;
        break;
      default:
        selectedToast = this.toast;
        break;
    }

    await selectedToast.waitFor({ state: 'visible', timeout: options?.timeout });
    await expect(selectedToast).toHaveText(message);
    await this.closeButton(selectedToast).click();
    await selectedToast.waitFor({ state: 'detached' });
  };
}
