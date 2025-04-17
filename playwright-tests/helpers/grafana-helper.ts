import { Page } from '@playwright/test';

const grafanaHelper = {
  async authorize(page: Page, username = 'admin', password = process.env.ADMIN_PASSWORD || 'admin') {
    const authToken = this.getToken(username, password);
    await page.goto('');
    await page.setExtraHTTPHeaders({ Authorization: `Basic ${authToken}` });
    await page.evaluate(() => {
      window.localStorage.setItem('0-grafana.pmm3.modalShown', 'true');
      window.localStorage.setItem('1-grafana.pmm3.modalShown', 'false');
    });
    await page.reload();
    return page;
  },

  async unAuthorize(page: Page) {
    await page.setExtraHTTPHeaders({});
    await page.reload();
  },

  getToken(username = 'admin', password = process.env.ADMIN_PASSWORD || 'admin') {
    return Buffer.from(`${username}:${password}`).toString('base64');
  },
};

export default grafanaHelper;
