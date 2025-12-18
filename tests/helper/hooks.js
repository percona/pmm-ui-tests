const { event, container } = require('codeceptjs');

// Guard to avoid registering listeners multiple times per worker/process (causes multiple waits in same tests)
if (!global.__pmmGrafanaIframeHookRegistered) {
  global.__pmmGrafanaIframeHookRegistered = true;

  module.exports = function () {
    // Switch to iframe only after amOnPage completes
    event.dispatcher.on(event.step.after, async (step) => {
      if (!step || step.name !== 'amOnPage') return;

      const helper = container.helpers('Playwright');

      // Reset to main context to avoid nested frame chains
      await helper.switchTo();
      await helper.waitForVisible('#grafana-iframe', 30);
      await helper.switchTo('#grafana-iframe');
      console.log('Switched to grafana iframe');
    });

    // Switch back to main context after each scenario
    event.dispatcher.on(event.test.after, async () => {
      const helper = container.helpers('Playwright');

      await helper.switchTo();
    });
  };
} else {
  module.exports = function () {};
}
