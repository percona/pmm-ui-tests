class MongodbPBMDetailsDashboard {
  constructor() {
    this.url = 'graph/d/mongodb-pbm-details/mongodb-pbm-details';
    this.elements = {
      backUpConfiguredValue: locate('//section[contains(@data-testid, "Backup Configured")]//span'),
      pitrEnabledValue: locate('//section[contains(@data-testid, "PITR Enabled")]//span'),
      refresh: locate('//button[contains(@data-testid, "RefreshPicker run button")]'),
    };
    this.metrics = [
      'Backup Configured',
      'Agent Status',
      'PITR Enabled',
      'Size Bytes',
      'Duration',
      'Backup history',
      'Last Successful Backup',
    ];
  }

  async verifyBackupConfiguredValue(expectedValue) {
    const I = actor();

    I.waitForVisible(this.elements.backUpConfiguredValue, 15);
    const value = await I.grabTextFrom(this.elements.backUpConfiguredValue);

    if (value !== expectedValue) {
      throw new Error(`Expected Value for panel Backup configured on MongoDB PMM Details dashboard does not equal expected value. Expected: "${expectedValue}". Actual: "${value}".`);
    }
  }

  async verifyPitrEnabledValue(expectedValue) {
    const I = actor();

    I.waitForVisible(this.elements.pitrEnabledValue, 15);
    await I.asyncWaitFor(async () => {
      I.click(this.elements.refresh);
      const value = await I.grabTextFrom(this.elements.pitrEnabledValue);

      return value === expectedValue;
    }, 60);
  }
}

module.exports = new MongodbPBMDetailsDashboard();
module.exports.MongodbPBMDetailsDashboard = MongodbPBMDetailsDashboard;
