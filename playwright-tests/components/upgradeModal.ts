import { Page } from '@playwright/test';
import { CommonPage } from '@pages/Common.page';

export default class UpgradeModal extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  containers = {
    modalContainer: this.page.getByRole('dialog'),
  };

  elements = {
    modalContent: this.containers.modalContainer.getByTestId('modal-output-pre'),
    upgradeInProgressHeader: this.containers.modalContainer.getByText('Upgrade in progress'),
    upgradeSuccess: this.containers.modalContainer.getByTestId('modal-update-success-text'),
  };

  buttons = {
    close: this.containers.modalContainer.getByTestId('modal-close'),
  };

  fields = {};

  messages = {
    inProgress: 'Update in progress',
    upgradeSuccess: (pmmVersion: string) => `PMM has been successfully upgraded to version ${pmmVersion}`,
  };
}
