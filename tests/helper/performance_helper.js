const Helper = codecept_helper;
const util = require('util');
const request = require('request');
const { chromium } = require('playwright');
const lighthouse = require('lighthouse');
const { playAudit } = require('playwright-lighthouse');

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

  async getPageTimeToInteractive(url) {
    /*
    const resp = await util.promisify(request)(
      'http://localhost:9222/json/version',
    );
    const browser = await chromium.connectOverCDP('http://localhost:9222/');
*/
    const { lhr } = await lighthouse(url, { port: 9222 });

    console.log(`
    Time To Interactive - Score: ${lhr.audits.interactive.score},
    Value: ${lhr.audits.interactive.numericValue} ${lhr.audits.interactive.numericUnit}
  `);
  }

  async getPageAudit(page) {
    return playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: 10,
        seo: 40,
        pwa: 30,
      },
    });
  }
}

module.exports = PerformanceHelper;
