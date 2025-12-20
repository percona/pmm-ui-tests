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

    if (['amOnPage', 'switchToNextTab', 'switchToPreviousTab'].includes(step.name)) {
      await switchToGrafana();
    }
  };

  /**
   * Helper function to extract valid Playwright selector from CodeceptJS locator
   */
  const getSelector = (locator) => {
    let selector = locator;

    if (typeof locator === 'object') {
      if (locator.xpath) {
        selector = `xpath=${locator.xpath}`;
      } else if (locator.css) {
        selector = locator.css;
      } else if (locator.value && locator.type) {
        // Handle cases where it's a Locator instance but properties are internal
        if (locator.type === 'xpath') selector = `xpath=${locator.value}`;
        else if (locator.type === 'css') selector = locator.value;
        else selector = locator.value;
      } else {
        selector = locator.toString();
      }
    }

    if (typeof selector === 'string') {
      // Handle stringified CodeceptJS locators (e.g., "{xpath: //...}")
      if (selector.startsWith('{xpath:') && selector.endsWith('}')) {
        return `xpath=${selector.substring(7, selector.length - 1).trim()}`;
      }

      if (selector.startsWith('{css:') && selector.endsWith('}')) {
        return selector.substring(5, selector.length - 1).trim();
      }
    }

    return selector;
  };

  /**
   * Patches grabTextFrom to explicitly use the helper context if available.
   * This fixes a specific issue in CodeceptJS Playwright helper where grabTextFrom
   * uses this.page.textContent() directly, ignoring the active frame context.
   */
  const originalGrabTextFrom = helper.grabTextFrom;

  helper.grabTextFrom = async function pmmGrabTextFrom(locator) {
    if (helper.context) {
      const selector = getSelector(locator);
      // Use the context (iframe) directly to find the element
      const element = helper.context.locator(selector).first();

      return element.textContent();
    }

    return originalGrabTextFrom.call(this, locator);
  };

  /**
   * Patches grabTextFromAll to explicitly use the helper context if available.
   */
  const originalGrabTextFromAll = helper.grabTextFromAll;

  helper.grabTextFromAll = async function pmmGrabTextFromAll(locator) {
    if (helper.context) {
      const selector = getSelector(locator);
      const elements = helper.context.locator(selector);

      return elements.allTextContents();
    }

    return originalGrabTextFromAll.call(this, locator);
  };

  /**
   * Patches waitForText to avoid using waitForFunction on FrameLocator
   * when specific context locator is provided.
   */
  const originalWaitForText = helper.waitForText;

  helper.waitForText = async function pmmWaitForText(text, sec = null, context = null) {
    if (helper.context && context) {
      const waitTimeout = sec ? sec * 1000 : helper.options.waitForTimeout;
      const selector = getSelector(context);
      // Use native Playwright text filtering which works with FrameLocator
      const element = helper.context.locator(selector).filter({ hasText: text }).first();

      await element.waitFor({ state: 'visible', timeout: waitTimeout });

      return;
    }

    return originalWaitForText.call(this, text, sec, context);
  };

  /**
   * Patches waitForDetached to correctly handle XPath locators in FrameLocator context.
   * Standard implementation uses waitForFunction which doesn't work with FrameLocator.
   */
  const originalWaitForDetached = helper.waitForDetached;

  helper.waitForDetached = async function pmmWaitForDetached(locator, sec = null) {
    if (helper.context) {
      const waitTimeout = sec ? sec * 1000 : helper.options.waitForTimeout;
      const selector = getSelector(locator);

      try {
        await helper.context.locator(selector).first().waitFor({ state: 'detached', timeout: waitTimeout });

        return;
      } catch (e) {
        // Fallback to original if simple locator fails (though it likely won't)
      }
    }

    return originalWaitForDetached.call(this, locator, sec);
  };

  /**
   * Patches usePlaywrightTo to pass the active context (iframe) as 'page'
   * if it exists. This allows usePlaywrightTo to work transparently inside iframes.
   */
  const originalUsePlaywrightTo = helper.usePlaywrightTo;

  helper.usePlaywrightTo = async function pmmUsePlaywrightTo(description, fn) {
    if (originalUsePlaywrightTo) {
      return originalUsePlaywrightTo.call(this, description, async (args) => {
        if (helper.context) {
          // Override page with the current context (iframe)
          // eslint-disable-next-line no-param-reassign
          args.page = helper.context;
        }

        return fn(args);
      });
    }
  };
};
