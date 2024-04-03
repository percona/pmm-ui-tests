const { I } = inject();

class ServiceAccountsPage {
  constructor() {
    this.url = 'graph/org/serviceaccounts';
    this.addAccountButton = locate('//a[@href="org/serviceaccounts/create"]');
    this.nameInput = locate('//input[@name="name"]');
    this.roleSelect = locate('//div[contains(@class, "grafana-select-value-container")]');
    this.roleSelectValue = (role) => locate(`//*[text()="${role}"]`);
    this.createButton = locate('//button[@type="submit"]');
    this.accountEditedMessage = 'Service account updated';
    this.addServiceAccountToken = locate('//span[text()="Add service account token"]');
    this.tokenName = locate('//input[@name="tokenName"]');
    this.generateTokenButton = locate('//span[text()="Generate token"]');
    this.tokenValue = locate('//input[@name="tokenValue"]');
  }

  async createServiceAccount(username, role) {
    await I.waitForVisible(this.addAccountButton);
    await I.click(this.addAccountButton);
    await I.waitForVisible(this.nameInput);
    await I.fillField(this.nameInput, username);
    await I.click(this.roleSelect);
    await I.click(this.roleSelectValue(role));
    await I.click(this.createButton);
    // should this be edited? Not created?
    await I.verifyPopUpMessage(this.accountEditedMessage);
  }

  async createServiceAccountToken(tokenName) {
    await I.click(this.addServiceAccountToken);
    await I.fillField(this.tokenName, tokenName);
    await I.click(this.generateTokenButton);
    await I.waitForVisible(this.tokenValue);

    return await I.grabValueFrom(this.tokenValue);
  }

  async createServiceAccountApi(username, role) {
    const response = await I.sendPostRequest('graph/api/serviceaccounts/', { name: username, role }, { Authorization: `Basic ${await I.getAuth()}` });

    return response.data;
  }

  async createServiceAccountTokenApi(accountId, tokenName) {
    const response = await I.sendPostRequest(`graph/api/serviceaccounts/${accountId}/tokens`, { name: tokenName }, { Authorization: `Basic ${await I.getAuth()}` });

    return response.data;
  }
}

module.exports = new ServiceAccountsPage();
module.exports.SericeAccountsPage = ServiceAccountsPage;
