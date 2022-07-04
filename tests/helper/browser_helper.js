const Helper = codecept_helper;

class BrowserHelper extends Helper {
  async getTabs() {
    const { Playwright } = this.helpers;
    const { browserContext } = Playwright;

    return await browserContext.pages();
  }

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
}

module.exports = BrowserHelper;
