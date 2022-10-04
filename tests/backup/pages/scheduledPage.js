const { I } = inject();

const scheduleCell = (name) => `//tr[td[contains(text(), "${name}")]]`;

module.exports = {
  url: 'graph/backup/scheduled',
  elements: {
    noData: '$table-no-data',
    modalHeader: '$modal-header',
    modalContent: '$modal-content',
    dropdownOption: (text) => locate('div[class$="-select-option-body"]').find('span').withText(text),
    selectedLocation: locate('div[class*="-singleValue"]').inside(locate('div').withChild('$location-select-label')),
    selectedService: locate('div[class*="-singleValue"]').inside(locate('div').withChild('$service-select-label')),
    retentionValidation: '$retention-field-error-message',
    scheduleName: (name) => locate('td').at(1).inside(scheduleCell(name)),
    scheduleVendorByName: (name) => locate('td').at(2).inside(scheduleCell(name)),
    frequencyByName: (name) => locate('td').at(3).inside(scheduleCell(name)),
    retentionByName: (name) => locate('td').at(4).inside(scheduleCell(name)),
    scheduleTypeByName: (name) => locate('td').at(5).inside(scheduleCell(name)),
    scheduleLocationByName: (name) => locate('td').at(6).inside(scheduleCell(name)),
    toggleByName: (name) => locate('$toggle-scheduled-backpup').inside(scheduleCell(name)),
    lastBackupByName: (name) => locate('$detailed-date').inside(scheduleCell(name)),
    scheduleBlockInModal: '$advanced-backup-fields',
    detailedInfoRow: {
      backupName: locate('$scheduled-backup-details-name').find('span').at(2),
      description: 'pre',
      dataModel: locate('$scheduled-backup-details-data-model').find('span').at(2),
      cronExpression: locate('$scheduled-backup-details-cron').find('span').at(2),
    },
  },
  buttons: {
    openAddScheduleModal: '$scheduled-backup-add-modal-button',
    createSchedule: '$backup-add-button',
    actionsMenuByName: (name) => locate('$dropdown-menu-toggle').inside(scheduleCell(name)),
    editByName: (name) => locate('$edit-scheduled-backpup-button').inside(scheduleCell(name)),
    deleteByName: (name) => locate('$delete-scheduled-backpup-button').inside(scheduleCell(name)),
    copyByName: (name) => locate('$copy-scheduled-backup-button').inside(scheduleCell(name)),
    enableDisableByName: (name) => locate('label').after('$toggle-scheduled-backpup').inside(scheduleCell(name)),
    backupTypeSwitch: (type) => locate('label').after('$mode-radio-button').withText(type),
    confirmDelete: '$confirm-delete-modal-button',
    cancelDelete: '$cancel-delete-modal-button',
  },
  fields: {
    backupName: '$backupName-text-input',
    vendor: '$vendor-text-input',
    description: '$description-textarea-input',
    serviceNameDropdown: locate('div[class$="-select-value-container"]').inside(locate('div').withChild('$service-select-label')),
    locationDropdown: locate('div[class$="-select-value-container"]').inside(locate('div').withChild('$location-select-label')),
    everyDropdown: '//label[@data-testid="period-field-label"]/parent::div/following-sibling::div[1]//div[contains(@class, "-select-value-container")]',
    retention: '$retention-number-input',
  },
  messages: {
    modalHeaderText: 'Schedule backup',
    requiredField: 'Required field',
    outOfRetentionRange: 'Value should be in the range from 0 to 99',
    backupScheduled: 'Backup successfully scheduled',
    confirmDelete: (name) => `Are you sure you want to delete the scheduled backup "${name}"?`,
    successfullyDeleted: (name) => `Scheduled backup "${name}" successfully deleted.`,
    scheduleInModalLabel: 'Schedule - UTC time',
  },
  locationType: {},

  openScheduledBackupsPage() {
    I.amOnPage(this.url);
    I.waitForText('Create scheduled backup', 30, this.buttons.openAddScheduleModal);
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

  copySchedule(name) {
    I.waitForVisible(this.buttons.actionsMenuByName(name), 10);
    I.click(this.buttons.actionsMenuByName(name));
    I.click(this.buttons.copyByName(name));
  },

  openDeleteModal(scheduleName) {
    I.waitForVisible(this.buttons.actionsMenuByName(scheduleName), 10);
    I.click(this.buttons.actionsMenuByName(scheduleName));
    I.waitForVisible(this.buttons.deleteByName(scheduleName), 2);
    I.click(this.buttons.deleteByName(scheduleName));
    I.waitForVisible(this.buttons.confirmDelete, 10);
  },

  verifyBackupValues(scheduleObj) {
    const {
      name, vendor, frequency, description, retention, type, location, dataModel, cronExpression,
    } = scheduleObj;

    this.verifyBackupRowValues(name, vendor, frequency, retention, type, location);
    this.verifyBackupDetailsRow(name, description, dataModel, cronExpression);
  },

  verifyBackupRowValues(name, vendor, frequency, retention, type, location) {
    I.seeElement(this.elements.scheduleName(name));
    I.seeTextEquals(vendor, this.elements.scheduleVendorByName(name));
    I.seeTextEquals(frequency, this.elements.frequencyByName(name));
    I.seeTextEquals(`${retention} backups`, this.elements.retentionByName(name));
    I.seeTextEquals(type, this.elements.scheduleTypeByName(name));
    I.seeTextEquals(location, this.elements.scheduleLocationByName(name));
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
