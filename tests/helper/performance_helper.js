const Helper = codecept_helper;

class PerformanceHelper extends Helper {
  async openNewTabs(numberOfTabs) {
    const { Playwright } = this.helpers;
    const { browserContext } = Playwright;
    const tabs = [];

    for (let i = 0; i < numberOfTabs; i++) {
      const newTab = await browserContext.newPage();

      tabs.push(newTab);
    }

    return tabs;
  }

  async navigateTabTo(tab, address) {
    if (!address.includes('http')) {
      tab.goto(process.env.PMM_UI_URL + address);
    } else {
      tab.goto(address);
    }
  }

  async getPageTimeLoad(page) {
    await page.waitForLoadState('load');
    const performanceTimingJson = await page.evaluate(() => JSON.stringify(window.performance.timing));
    const performanceTiming = JSON.parse(performanceTimingJson);
    const startToInteractive = performanceTiming.domInteractive - performanceTiming.navigationStart;

    return startToInteractive;
  }
}

module.exports = PerformanceHelper;
