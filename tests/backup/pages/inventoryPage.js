const { I } = inject();

const artifactCell = (name) => `//tr[td/div[contains(text(), "${name}")]]`;

module.exports = {
  url: 'graph/backup/inventory',
  elements: {
    noData: '$table-no-data',
    modalHeader: '$modal-header',
    columnHeaderLocator: (columnHeaderText) => `//th[text()="${columnHeaderText}"]`,
    dropdownOption: (text) => locate('div[class$="-select-option-body"]').find('span').withText(text),
    selectedLocation: locate('div[class$="-singleValue"]').inside(locate('div').withChild('$location-select-label')),
    selectedService: locate('div[class$="-singleValue"]').inside(locate('div').withChild('$service-select-label')),
    inProgressBackup: '$statusPending',
    backupStatus: '$statusMsg',
    pendingBackupByName: (name) => locate('$statusPending').inside(artifactCell(name)),
    backupStatusByName: (name) => locate('$statusMsg').inside(artifactCell(name)),
    forceDeleteLabel: '$force-field-label',
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
    I.waitForVisible(this.elements.backupStatusByName(backupName), 120);
    I.seeTextEquals('Success', this.elements.backupStatusByName(backupName));
  },
};
