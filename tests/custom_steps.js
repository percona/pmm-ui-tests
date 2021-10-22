const systemMessageLocator = locate('//*[@class="page-alert-list"]/.//div[@aria-label]');
const systemMessageText = locate('//div[contains(@aria-label, "Alert ")]/div/div[not(*)]');
const systemMessageButtonClose = locate('.page-alert-list button');

module.exports = () => actor({

  verifyPopUpMessage(message, timeout = 30) {
    this.waitForElement(systemMessageLocator, timeout);
    this.see(message, systemMessageText);
    this.click(systemMessageButtonClose);
  },

  useDataQA: (selector) => `[data-testid="${selector}"]`,
});
