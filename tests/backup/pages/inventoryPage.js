const { I } = inject();

const artifactCell = (name) => `//tr[td/div[contains(text(), "${name}")]]`;

module.exports = {
  url: 'graph/backup/inventory',
  elements: {
    noData: '$table-no-data',
    columnHeaderLocator: (columnHeaderText) => `//th[text()="${columnHeaderText}"]`,
  },
  buttons: {
    openAddBackupModal: '$backup-add-modal-button',
    // restoreByName returns Restore button locator for a given Artifact name
    restoreByName: (name) => locate('$restore-backup-artifact-button').inside(artifactCell(name)),
    showDetails: (name) => locate('$show-details').inside(artifactCell(name)),
    hideDetails: (name) => locate('$hide-details').inside(artifactCell(name)),
  },
  fields: {},
  messages: {},
  locationType: {},

  openInventoryPage() {
    I.amOnPage(this.url);
    I.waitForText('Add', 30, this.buttons.openAddBackupModal);
  },
};
