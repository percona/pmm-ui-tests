const { I } = inject();

const scheduleCell = (name) => `//tr[td/div[contains(text(), "${name}")]]`;

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
    retentionByName: (name) => locate('td').at(4).inside(scheduleCell(name)),
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
    retention: '$retention-number-input',
  },
  messages: {
    modalHeaderText: 'Schedule backup',
    requiredField: 'Required field',
    outOfRetentionRange: 'Value should be in the range from 0 to 99',
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
};
