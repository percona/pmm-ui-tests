class mongodbPBMDetailsDashboard {
  constructor() {}

  private elements = {
    backUpConfiguredValue: locate('//section[contains(@data-testid, "Backup Configured")]//span'),
    pitrEnabledValue: locate('//section[contains(@data-testid, "PITR Enabled")]//span'),
  }

  url = 'graph/d/mongodb-pbm-details/mongodb-pbm-details'

  metrics: string[] = [
    'Backup Configured',
    'Agent Status',
    'PITR Enabled',
    'Size Bytes',
    'Duration',
    'Backup history',
    'Last Successful Backup',
  ]

  verifyBackupConfiguredValue = async (expectedValue: string) => {
    const I = actor();
    I.waitForVisible(this.elements.backUpConfiguredValue, 15)
    const value = await I.grabTextFrom(this.elements.backUpConfiguredValue);
    if(value !== expectedValue) {
      throw new Error(`Expected Value for panel Backup configured on MongoDB PMM Details dashboard does not equal expected value. Expected: "${expectedValue}". Actual: "${value}".`);
    }
  }
  verifyPitrEnabledValue = async (expectedValue: string) => {
    const I = actor();
    I.waitForVisible(this.elements.pitrEnabledValue, 15)
    const value = await I.grabTextFrom(this.elements.pitrEnabledValue);
    if(value !== expectedValue) {
      throw new Error(`Expected Value for panel PITR Enabled on MongoDB PMM Details dashboard does not equal expected value. Expected: "${expectedValue}". Actual: "${value}".`);
    }
  }
}

export default mongodbPBMDetailsDashboard;