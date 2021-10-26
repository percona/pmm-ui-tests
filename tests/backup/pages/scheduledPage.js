const { I } = inject();

const scheduleCell = (name) => `//tr[td/div[contains(text(), "${name}")]]`;
const scheduleDetailText = (dataTestId) => `//span[@data-testid="scheduled-backup-details-${dataTestId}"]/span[not(@class)]`;

module.exports = {
  url: 'graph/backup/scheduled',
  elements: {
    noData: '$table-no-data',
    modalHeader: '$modal-header',
    dropdownOption: (text) => locate('div[class$="-select-option-body"]').find('span').withText(text),
    selectedLocation: locate('div[class$="-singleValue"]').inside(locate('div').withChild('$location-select-label')),
    selectedService: locate('div[class$="-singleValue"]').inside(locate('div').withChild('$service-select-label')),
    retentionValidation: '$retention-field-error-message',
    scheduleName: (name) => locate('td').at(1).inside(scheduleCell(name)),
    scheduleVendorByName: (name) => locate('td').at(2).inside(scheduleCell(name)),
    frequencyByName: (name) => locate('td').at(3).inside(scheduleCell(name)),
    retentionByName: (name) => locate('td').at(4).inside(scheduleCell(name)),
    scheduleTypeByName: (name) => locate('td').at(5).inside(scheduleCell(name)),
    scheduleLocationByName: (name) => locate('td').at(6).inside(scheduleCell(name)),
    detailedInfoRow: {
      backupName: locate(scheduleDetailText('name')),
      description: locate('pre'),
      dataModel: locate(scheduleDetailText('data-model')),
      cronExpression: locate(scheduleDetailText('cron')),
    },
  },
  buttons: {
    openAddScheduleModal: '$scheduled-backup-add-modal-button',
    createSchedule: '$backup-add-button',
    deleteByName: (name) => locate('$edit-scheduled-backpup-button').inside(scheduleCell(name)),
  },
  fields: {
    backupName: '$backupName-text-input',
    vendor: '$vendor-text-input',
    description: '$description-textarea-input',
    serviceNameDropdown: locate('div[class$="-select-value-container"]').inside(locate('div').withChild('$service-select-label')),
    locationDropdown: locate('div[class$="-select-value-container"]').inside(locate('div').withChild('$location-select-label')),
    everyDropdown: locate('div[class$="-select-value-container"]').inside(locate('div').withChild('$period-select-label')),
    retention: '$retention-number-input',
  },
  messages: {
    modalHeaderText: 'Schedule backup',
    requiredField: 'Required field',
    outOfRetentionRange: 'Value should be in the range from 0 to 99',
    backupScheduled: 'Backup successfully scheduled',
  },
  locationType: {},

  openScheduledBackupsPage() {
    I.amOnPage(this.url);
    I.waitForText('Add', 30, this.buttons.openAddScheduleModal);
  },

  openScheduleBackupModal() {
    I.click(this.buttons.openAddScheduleModal);
    I.waitForVisible(this.elements.modalHeader, 20);
    I.seeTextEquals(this.messages.modalHeaderText, this.elements.modalHeader);
  },

  selectDropdownOption(dropdownLocator, text) {
    I.click(dropdownLocator);
    I.waitForVisible(this.elements.dropdownOption(text), 30);
    I.click(this.elements.dropdownOption(text));
    I.dontSeeElement(this.elements.dropdownOption(text));
  },

  clearRetentionField() {
    // clearField method doesn't work for this field
    I.usePlaywrightTo('clear field', async ({ page }) => {
      await page.fill(I.useDataQA('retention-number-input'), '');
    });
  },

  verifyBackupValues(scheduleObj) {
    const {
      name, vendor, description, retention, type, location, dataModel, cronExpression,
    } = scheduleObj;

    this.verifyBackupRowValues(name, vendor, description, retention, type, location);
    this.verifyBackupDetailsRow(name, description, dataModel, cronExpression);
  },

  verifyBackupRowValues(name, vendor, description, retention, type, location) {
    I.seeElement(this.elements.scheduleName(name));
    I.see(vendor, this.elements.scheduleVendorByName(name));
    I.see(description, this.elements.frequencyByName(name));
    I.see(`${retention} backups`, this.elements.retentionByName(name));
    I.see(type, this.elements.scheduleTypeByName(name));
    I.see(location, this.elements.scheduleLocationByName(name));
  },

  verifyBackupDetailsRow(name, description, dataModel, cronExpression) {
    I.seeElement(this.elements.scheduleName(name));
    I.click(this.elements.scheduleName(name));
    I.waitForVisible(this.elements.detailedInfoRow.backupName, 2);
    I.seeTextEquals(name, this.elements.detailedInfoRow.backupName);
    I.seeTextEquals(description, this.elements.detailedInfoRow.description);
    I.seeTextEquals(dataModel, this.elements.detailedInfoRow.dataModel);
    I.seeTextEquals(cronExpression, this.elements.detailedInfoRow.cronExpression);
  },
};
