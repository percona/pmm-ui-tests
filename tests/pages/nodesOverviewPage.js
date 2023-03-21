const { I, dashboardPage } = inject();

module.exports = {
  url: 'graph/d/node-instance-overview/nodes-overview',
  elements: {},
  fields: {},
  buttons: {
    environment: '//button[@id="var-environment"]/span',
    selectEnvironment: (envName) => `//*[@role="checkbox"]//*[text()="${envName}"]`,
    refreshDashboard: '//*[@aria-label="Refresh dashboard"]',
  },
  messages: {},

  async selectEnvironment(envName) {
    await I.waitForVisible(this.buttons.environment);
    await I.click(this.buttons.environment);
    const availableEnvs = await I.grabTextFromAll('//*[contains(@data-testid, "Dashboard template variables Variable Value DropDown option text")]');

    console.log(`Available Environments are: ${availableEnvs}`);
    await I.click(this.buttons.selectEnvironment(envName));
    await I.click(dashboardPage.fields.metricPanel);
    await I.waitForText('dev', 30, this.buttons.environment);
  },
};
