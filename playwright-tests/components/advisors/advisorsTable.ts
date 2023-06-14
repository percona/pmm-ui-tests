import { expect, Page } from '@playwright/test';
import Table from '../table';

export default class AdvisorsTable extends Table {
  constructor(page: Page) {
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
}
