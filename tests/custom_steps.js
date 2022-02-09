const assert = require('assert');

const systemMessageText = '.page-alert-list div[data-testid^="data-testid Alert"] > div';
const systemMessageButtonClose = '.page-alert-list button';

module.exports = () => actor({

  verifyPopUpMessage(message, timeout = 30) {
    this.waitForElement(systemMessageText, timeout);
    this.see(message, systemMessageText);
    this.click(systemMessageButtonClose);
  },

  useDataQA: (selector) => `[data-testid="${selector}"]`,
  getSingleSelectOptionLocator: (optionName) => locate('[aria-label="Select option"]')
    .find('span')
    .withText(optionName)
    .inside('[aria-label="Select options menu"]'),

  seeElementsDisabled(locator) {
    this.seeAttributesOnElements(locator, { disabled: true });
  },
  seeElementsEnabled(locator) {
    this.seeAttributesOnElements(locator, { disabled: null });
  },

  /**
   * Fluent wait for the specified callable. Callable should be async and return bool value
   * Fails test if timeout exceeded.
   *
   * @param     boolCallable      should be a function with boolean return type
   * @param     timeOutInSeconds  time to wait for a service to appear
   * @returns   {Promise<void>}   requires await when called
   */
  async asyncWaitFor(boolCallable, timeOutInSeconds) {
    const start = new Date().getTime();
    const timout = timeOutInSeconds * 1000;
    const interval = 1;

    /* eslint no-constant-condition: ["error", { "checkLoops": false }] */
    while (true) {
      // Main condition check
      if (await boolCallable()) {
        return;
      }

      // Check the timeout after evaluating main condition
      // to ensure conditions with a zero timeout can succeed.
      if (new Date().getTime() - start >= timout) {
        assert.fail(`"${boolCallable.name}" is false: 
        tried to check for ${timeOutInSeconds} second(s) with ${interval} second(s) with interval`);
      }

      this.wait(interval);
    }
  },
});
