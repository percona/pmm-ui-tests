const { event, container } = require('codeceptjs');

let hooksRegistered = false;

module.exports = function pmmGrafanaIframeHook() {
  // Prevent double-registration per worker
  if (hooksRegistered) return;

  hooksRegistered = true;

  const helper = container.helpers('Playwright');
  const grafanaIframe = '#grafana-iframe';

  /**
   * Switches execution context to the Grafana iframe.
   * Ensures the page is loaded and the iframe is visible before switching.
   */
  const switchToGrafana = async () => {
    try {
      // Reset to main frame first
      await helper.switchTo();
      if (helper.page) {
        await helper.page.waitForLoadState('domcontentloaded');
      }

      await helper.waitForVisible(grafanaIframe, 60);
      await helper.switchTo(grafanaIframe);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[Hooks] Error switching to Grafana iframe: ${e.message}`);
    }
  };

  /**
   * Resets execution context to the main frame.
   */
  const resetContext = async () => {
    try {
      await helper.switchTo();
    } catch (e) {
      // Ignore errors if browser is already closed or context is invalid
    }
  };

  // Reset context at the start and end of each test to avoid frame nesting issues
  event.dispatcher.on(event.test.started, resetContext);
  event.dispatcher.on(event.test.after, resetContext);

  // Patch _afterStep to automatically switch to Grafana iframe after navigation
  // eslint-disable-next-line no-underscore-dangle
  const originalAfterStep = helper._afterStep;

  // eslint-disable-next-line no-underscore-dangle
  helper._afterStep = async function pmmAfterStep(step) {
    if (originalAfterStep) {
      await originalAfterStep.call(this, step);
    }

    if (step.name === 'amOnPage') {
      await switchToGrafana();
    }
  };
};
