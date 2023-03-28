import { Page } from '@playwright/test';

const grafanaHelper = {
  async authorize(page: Page, username: string = 'admin', password = process.env.ADMIN_PASSWORD) {
    const authToken = await this.getToken(username, password);
    await page.setExtraHTTPHeaders({ Authorization: `Basic ${authToken}` });
    await page.reload();
  },

  async unAuthorize(page: Page) {
    await page.setExtraHTTPHeaders({});
    await page.reload();
  },

  async getToken(username: string = 'admin', password = process.env.ADMIN_PASSWORD || 'admin') {
    return Buffer.from(`${username}:${password}`).toString('base64');
  },
};

export default grafanaHelper;
