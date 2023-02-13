import { expect, Page } from '@playwright/test';
import Table from './table';

export default class RbacTable extends Table {
  constructor(readonly page: Page) { 
    super(page);
  }

  elements = {
    ...super.getTableElements(),
  };

  fields = {
    ...super.getTableFields(),
  };

  labels = {
    ...super.getTableLabels(),
    fullAccess: 'Full access',
  };

  buttons = {
    ...super.getTableButtons(),
  };

  messages = {
    ...super.getTableMessages(),
  };

  links = {
    ...super.getTableLinks(),
  };

  verifyRowData = async (name:string, description:string, label: string, operator: string, value:string) => {
    await expect(this.elements.rowByText(name)).toContainText(description);
    await expect(this.elements.rowByText(name)).toContainText(`{${label + operator}"${value}"}`);
  }

}
