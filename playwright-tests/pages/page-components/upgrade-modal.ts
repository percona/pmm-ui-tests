import { CommonPage } from '@pages/common.page';
import { Page } from '@playwright/test';

const modalContainerLocator = (page: Page) => page.locator('//*[role="dialog"] | //*[contains(@class,"modalHeader")]/parent::div');

export default class UpgradeModal extends CommonPage {
  containers = {
    modalContainer: modalContainerLocator(this.page),
  };

  elements: any = {
    ...this.elements,
    modalContent: modalContainerLocator(this.page).getByTestId('modal-output-pre'),
    upgradeInProgressHeader: modalContainerLocator(this.page).getByText('Upgrade in progress'),
    upgradeSuccess: modalContainerLocator(this.page).getByTestId('modal-update-success-text'),
  };

  buttons = {
    close: modalContainerLocator(this.page).getByTestId('modal-close'),
  };

  messages: any = {
    inProgress: 'Update in progress',
    upgradeSuccess: (pmmVersion: string) => `PMM has been successfully upgraded to version ${pmmVersion}`,
  };
}
