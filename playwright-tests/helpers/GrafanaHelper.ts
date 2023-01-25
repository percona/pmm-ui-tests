import { BrowserContext, Page } from "@playwright/test";

const grafanaHelper = {
  authorize: async (page: Page, username: string = 'admin', password = process.env.ADMIN_PASSWORD) => {
    const authToken = Buffer.from(`${username}:${password}`).toString('base64');
    page.setExtraHTTPHeaders({ Authorization: `Basic ${authToken}` });
  },
}

export default grafanaHelper;