const { I } = inject();
const faker = require('faker');

const artifactCell = (name) => `//tr[td[contains(text(), '${name}')]]`;

module.exports = {
  url: 'graph/backup/inventory',
  elements: {
    noData: '$table-no-data',
    modalHeader: '$modal-header',
    columnHeaderLocator: (columnHeaderText) => `//th[text()="${columnHeaderText}"]`,
    dropdownOption: (text) => locate('div[class$="-select-option-body"]').find('span').withText(text),
    selectedLocation: '//label[@data-testid="location-field-label"]/parent::div/following-sibling::div[1]//div[contains(@class, "-singleValue")]',
    selectedService: locate('div[class*="-singleValue"]').inside(locate('span').withChild('$service-select-label')),
    inProgressBackup: '$statusPending',
    backupStatus: '$statusMsg',
    pendingBackupByName: (name) => locate('$statusPending').inside(artifactCell(name)),
    backupStatusByName: (name) => locate('$statusMsg').inside(artifactCell(name)),
    backupStatusIconByName: (name) => locate('$statusMsg').inside(artifactCell(name)).find('div'),
    backupDateByName: (name) => locate('$detailed-date').inside(artifactCell(name)),
    artifactName: (name) => locate('td').at(2).inside(artifactCell(name)),
    forceDeleteLabel: '$force-field-label',
    retryTimes: '$retryTimes-number-input',
    retryInterval: '$retryInterval-number-input',
    dataModelState: '$dataModel-radio-state',
    backupModalError: '$backup-modal-error',
    backupNameInput: '$backupName-text-input',
    backUpNameInputError: '$backupName-field-error-message',
    fullBackUpName: '$backup-artifact-details-name',
    addBackupModalErrorsContainer: '$backup-errors',
    addBackupModalError: locate('$backup-errors').find('span'),
    addBackupModalErrorReadMore: locate('$backup-errors').find('a'),
  },
  buttons: {
    openAddBackupModal: '$backup-add-button',
    showAdvancedSettings: '//div[text()="Advanced Settings:"]/preceding-sibling::button',
    // restoreByName returns Restore button locator for a given Artifact name
    backupLogsByName: (name) => locate('span[role="button"]').inside(artifactCell(name)),
    actionsMenuByName: (name) => locate('$dropdown-menu-toggle').inside(artifactCell(name)),
    restoreByName: (name) => locate('$restore-backup-artifact-button').inside(artifactCell(name)),
    deleteByName: (name) => locate('$delete-backup-artifact-button').inside(artifactCell(name)),
    showDetails: (name) => locate('$show-row-details').inside(artifactCell(name)),
    hideDetails: (name) => locate('$hide-row-details').inside(artifactCell(name)),
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
    serviceNameDropdown: locate('div[class$="-select-value-container"]').inside(locate('span').withChild('$service-select-label')),
    locationDropdown: '//label[@data-testid="location-field-label"]/parent::div/following-sibling::div[1]//div[contains(@class, "-select-value-container")]',
  },
  messages: {
    modalHeaderText: 'Delete backup artifact',
    forceDeleteLabelText: 'Delete from storage',
    confirmDeleteText: (backupName) => `Are you sure you want to delete "${backupName}"?`,
    serviceNoLongerExists: 'This service no longer exists. Please choose a compatible one.',
    lengthErrorBackupName: 'Must contain at most 100 characters',
  },
  modal: {
    header: '$modal-header',
    copyToClipboardButton: locate('button').withText('Copy to clipboard').inside('$modal-content'),
    content: locate('pre').inside('$modal-content'),
  },
  locationType: {},

  openInventoryPage() {
    I.amOnPage(this.url);
    I.waitForText('Create backup', 30, this.buttons.openAddBackupModal);
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
    I.seeAttributesOnElements(this.elements.backupStatusIconByName(backupName), { 'data-testid': 'success-icon' });
  },

  openDeleteBackupModal(backupName) {
    I.waitForVisible(this.buttons.actionsMenuByName(backupName), 10);
    I.click(this.buttons.actionsMenuByName(backupName));
    I.waitForVisible(this.buttons.deleteByName(backupName), 2);
    I.click(this.buttons.deleteByName(backupName));
    I.waitForVisible(this.elements.forceDeleteLabel, 20);
  },

  startRestore(backupName) {
    I.click(this.buttons.actionsMenuByName(backupName));
    I.waitForVisible(this.buttons.restoreByName(backupName), 2);
    I.click(this.buttons.restoreByName(backupName));
    I.waitForVisible(this.buttons.modalRestore, 10);
    I.click(this.buttons.modalRestore);
  },

  inputRandomBackupName(length = 10) {
    const backupName = faker.random.alpha(length);

    I.clearField(this.elements.backupNameInput);
    I.fillField(this.elements.backupNameInput, backupName);

    return backupName;
  },
};
