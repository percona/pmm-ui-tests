import { expect } from '@playwright/test';
import { CommonPage } from '@pages/common.page';

export class AddServicePage extends CommonPage {
  url = 'graph/add-instance';

  buttons = {
    amazonRds: this.page.getByTestId('rds-instance'),
    postgreSql: this.page.getByTestId('postgresql-instance'),
    mySql: this.page.getByTestId('mysql-instance'),
    mongoDb: this.page.getByTestId('mongodb-instance'),
    proxySql: this.page.getByTestId('proxysql-instance'),
    externalService: this.page.getByTestId('external-instance'),
    haProxy: this.page.getByTestId('haproxy-instance'),
  };

  verifyAllButtonsVisible = async () => {
    await expect(this.buttons.amazonRds).toBeVisible();
    await expect(this.buttons.postgreSql).toBeVisible();
    await expect(this.buttons.mySql).toBeVisible();
    await expect(this.buttons.mongoDb).toBeVisible();
    await expect(this.buttons.proxySql).toBeVisible();
    await expect(this.buttons.externalService).toBeVisible();
    await expect(this.buttons.haProxy).toBeVisible();
  };
}
