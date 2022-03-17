const { I } = inject();
const faker = require('faker');

const artifactCell = (name) => `//tr[td/div/span[contains(text(), "${name}")]]`;

module.exports = {
  url: 'graph/backup/inventory',
  elements: {
    noData: '$table-no-data',
    modalHeader: '$modal-header',
    columnHeaderLocator: (columnHeaderText) => `//th[text()="${columnHeaderText}"]`,
    dropdownOption: (text) => locate('div[class$="-select-option-body"]').find('span').withText(text),
    selectedLocation: locate('div[class*="-singleValue"]').inside(locate('div').withChild('$location-select-label')),
    selectedService: locate('div[class*="-singleValue"]').inside(locate('div').withChild('$service-select-label')),
    inProgressBackup: '$statusPending',
    backupStatus: '$statusMsg',
    pendingBackupByName: (name) => locate('$statusPending').inside(artifactCell(name)),
    backupStatusByName: (name) => locate('$statusMsg').inside(artifactCell(name)),
    artifactName: (name) => locate('td').at(1).inside(artifactCell(name)),
    forceDeleteLabel: '$force-field-label',
    retryTimes: '$retryTimes-number-input',
    retryInterval: '$retryInterval-number-input',
    dataModelState: '$dataModel-radio-state',
    backupModalError: '$backup-modal-error',
    backupNameInput: '//input[@id="input-backupName-id"]',
    backUpNameInputError: '$backupName-field-error-message',
    fullBackUpName: '$backup-artifact-details-name',
    backupNameSpan: (name) => locate(`//span[contains(text(), "${name}")]`),
  },
  buttons: {
    openAddBackupModal: '$backup-add-modal-button',
    // restoreByName returns Restore button locator for a given Artifact name
    restoreByName: (name) => locate('$restore-backup-artifact-button').inside(artifactCell(name)),
    deleteByName: (name) => locate('$delete-backup-artifact-button').inside(artifactCell(name)),
    showDetails: (name) => locate('$show-details').inside(artifactCell(name)),
    hideDetails: (name) => locate('$hide-details').inside(artifactCell(name)),
    addBackup: '$backup-add-button',
    modalRestore: '$restore-button',
    forceDeleteCheckbox: '$force-checkbox-input',
    confirmDelete: '$confirm-delete-modal-button',
    retryModeOption: (option) => locate('$retry-mode-selector').find('div').at(1).find('label')
      .withText(option),
    dataModel: '$dataModel-radio-button',
  },
  fields: {
    backupName: '$backupName-text-input',
    vendor: '$vendor-text-input',
    description: '$description-textarea-input',
    serviceNameDropdown: locate('div[class$="-select-value-container"]').inside(locate('div').withChild('$service-select-label')),
    locationDropdown: locate('div[class$="-select-value-container"]').inside(locate('div').withChild('$location-select-label')),
  },
  messages: {
    modalHeaderText: 'Delete backup artifact',
    forceDeleteLabelText: 'Delete from storage',
    confirmDeleteText: (backupName) => `Are you sure you want to delete "${backupName}"?`,
    serviceNoLongerExists: 'This service no longer exists. Please choose a compatible one.',
    lengthErrorBackupName: 'Must contain at most 100 characters',
  },
  locationType: {},

  openInventoryPage() {
    I.amOnPage(this.url);
    I.waitForText('Add', 30, this.buttons.openAddBackupModal);
  },

  selectDropdownOption(dropdownLocator, text) {
    I.click(dropdownLocator);
    I.waitForVisible(this.elements.dropdownOption(text), 30);
    I.click(this.elements.dropdownOption(text));
    I.dontSeeElement(this.elements.dropdownOption(text));
  },

  verifyBackupSucceeded(backupName) {
    I.amOnPage(this.url);
    I.waitForVisible(this.elements.backupStatusByName(backupName), 120);
    I.seeTextEquals('Success', this.elements.backupStatusByName(backupName));
  },

  startRestore(backupName) {
    I.click(this.buttons.restoreByName(backupName));
    I.waitForVisible(this.buttons.modalRestore, 10);
    I.click(this.buttons.modalRestore);
  },

  inpuRandomBackupName(length = 10) {
    const backupName = faker.random.alpha(length);

    I.clearField(this.elements.backupNameInput);
    I.fillField(this.elements.backupNameInput, backupName);

    return backupName;
  },
};
