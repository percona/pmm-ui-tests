const Helper = codecept_helper;

class Clipboard extends Helper {
  async readClipboard() {
    const { Playwright } = this.helpers;

    return await Playwright.executeScript(() => navigator.clipboard.readText());
  }
}

module.exports = Clipboard;
