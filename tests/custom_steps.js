const systemMessageLocator = '//*[@class="page-alert-list"]/.//div[@aria-label]';
const systemMessageText = '//div[contains(@aria-label, "Alert ")]/div/div[not(*)]';
const systemMessageButtonClose = '.page-alert-list button';

module.exports = () => actor({

  verifyPopUpMessage(message, timeout = 30) {
    this.waitForElement(systemMessageLocator, timeout);
    this.seeTextEquals(message, systemMessageText);
    this.click(systemMessageButtonClose);
  },

  useDataQA: (selector) => `[data-testid="${selector}"]`,
});
