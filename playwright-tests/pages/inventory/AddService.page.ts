import { expect, Page } from '@playwright/test';
import ServicesTable from '@tests/components/configuration/servicesTable';
import { CommonPage } from '../Common.page';

export class AddServicePage extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/add-instance';

  elements = {
    ...super.getElements(),
  };

  fields = {
    ...super.getFields(),
  };

  labels = {
    ...super.getLabels(),
  };

  buttons = {
    ...super.getButtons(),
    amazonRds: this.page.getByTestId('rds-instance'),
    postgreSql: this.page.getByTestId('postgresql-instance'),
    mySql: this.page.getByTestId('mysql-instance'),
    mongoDb: this.page.getByTestId('mongodb-instance'),
    proxySql: this.page.getByTestId('proxysql-instance'),
    externalService: this.page.getByTestId('external-instance'),
    haProxy: this.page.getByTestId('haproxy-instance'),
  };

  messages = {
    ...super.getMessages(),
  };

  links = {
    ...super.getLinks(),
  };

  verifyAllButtonsVisible = async () => {
    await expect(this.buttons.amazonRds).toBeVisible();
    await expect(this.buttons.postgreSql).toBeVisible();
    await expect(this.buttons.mySql).toBeVisible();
    await expect(this.buttons.mongoDb).toBeVisible();
    await expect(this.buttons.proxySql).toBeVisible();
    await expect(this.buttons.externalService).toBeVisible();
    await expect(this.buttons.haProxy).toBeVisible();
  }
}
