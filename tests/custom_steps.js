const systemMessageLocator = '.page-alert-list div[aria-label^="Alert"]';
const systemMessageText = 'div[aria-label^="Alert"] > div';
const systemMessageButtonClose = '.page-alert-list button';

module.exports = () => actor({

  verifyPopUpMessage(message, timeout = 3) {
    this.waitForElement(systemMessageLocator, timeout);
    this.see(message, systemMessageText);
    this.click(systemMessageButtonClose);
  },

  useDataQA: (selector) => `[data-testid="${selector}"]`,

  seeElementsDisabled(locator) {
    this.seeAttributesOnElements(locator, { disabled: true });
  },
  seeElementsEnabled(locator) {
    this.seeAttributesOnElements(locator, { disabled: null });
  },
});
