import { Page } from '@playwright/test';

export default class ConfirmDeleteModal {
  constructor(readonly page: Page) { }

  private modal = this.page.getByRole('dialog');

  elements: any = {
    modalHeader: this.modal.locator('//h4'),
  };
  buttons = {
    proceed: this.modal.getByText('Proceed'),
    force: this.page.locator('//input[@id="input-force-id"]'),
  };

  messages: any = {
    serviceHasAgents: (serviceId: string) => `Service with ID "${serviceId}" has agents.`,
    confirmNodeDeleteHeader: (numberNodes = 1) => `Are you sure that you want to permanently delete ${numberNodes} nodes`,
  };
}
