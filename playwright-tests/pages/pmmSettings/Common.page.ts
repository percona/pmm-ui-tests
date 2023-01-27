/* eslint-disable lines-between-class-members */
import { Page } from '@playwright/test';
import { Toast } from '../../components/toast.component';

export class CommonPage {
  // eslint-disable-next-line no-empty-function
  constructor(readonly page: Page) {}

  toast = new Toast(this.page);

}
