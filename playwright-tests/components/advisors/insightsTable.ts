import { expect, Locator, Page } from '@playwright/test';
import Table from '../table';
import Duration from '@tests/helpers/Duration';

export default class InsightsTable extends Table {
  constructor(page: Page) {
    super(page);
  }

  elements = {
    ...super.getTableElements(),
    warningAdvisor: this.page.locator('//span[text()="Warning"]//ancestor::tr'),
    noticeAdvisor: this.page.locator('//span[text()="Notice"]//ancestor::tr'),
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

  waitForWarningAdvisorsDisplayed = async (minFailedAdvisors: number, timeout: Duration = Duration.OneMinute) => {
    await this.waitForAdvisorsDisplayed(this.elements.warningAdvisor, minFailedAdvisors, timeout)
  }

  waitForNoticeAdvisorsDisplayed = async (minFailedAdvisors: number, timeout: Duration = Duration.OneMinute) => {
    await this.waitForAdvisorsDisplayed(this.elements.noticeAdvisor, minFailedAdvisors, timeout)
  }

  private waitForAdvisorsDisplayed = async (locator: Locator, minFailedAdvisors: number, timeout: Duration = Duration.OneMinute) => {
    let retries = 0;
    while (await locator.count() < minFailedAdvisors) {
      console.log(await locator.count());
      await this.page.reload();
      await this.page.waitForTimeout(Duration.TenSeconds);
      retries++;
      if (retries > timeout / Duration.TenSeconds) {
        expect(false, 'Warning advisors were not displayed in requested time.').toBeTruthy();
      }
    }
  }
}
