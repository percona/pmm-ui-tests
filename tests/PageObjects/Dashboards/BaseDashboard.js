const { I } = inject();

module.exports = {
  serviceName: '//label[@for="var-service_name"]//following-sibling::*',
  serviceNameDropdown: '//*[@id="options-service_name"]',
  serviceNameDropdownSelect: async (databaseName) => `${this.serviceNameDropdown}//span[contains(@data-testid, "${databaseName}")]`,

  async getServiceName() {
    await I.waitForVisible(this.serviceName, 30);

    return I.grabTextFrom(this.serviceName);
  },

  async selectServiceName(expectedName) {
    if ((await this.getServiceName()) !== expectedName) {
      await I.click(this.serviceName);
      await I.click(await this.serviceNameDropdownSelect(expectedName));
    } else {
      await I.say(`Service ${expectedName} already selected.`);
    }
  },
};
