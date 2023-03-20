const { I } = inject();

module.exports = {
  url: 'graph/d/node-instance-overview/nodes-overview',
  elements: {},
  fields: {},
  buttons: {
    environment: '//button[@id="var-environment"]',
    selectEnvironment: (envName) => `//*[@role="checkbox"]//*[text()="${envName}"]`
  },
  messages: {},

  async selectEnvironment(envName) {
    await I.click(this.buttons.environment);
    await I.click(this.buttons.selectEnvironment(envName));
  }
};




