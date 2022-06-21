const { I } = inject();
module.exports = {
    url: 'graph/admin/upgrading',
    buttons: {
        contactUs: locate('span').withText('Contact us and get a free trial'),
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
    openStatsAndLicensePage() {
      I.amOnPage(this.url);
      I.waitForText('Add', 30, this.buttons.openAddBackupModal);
    },
  };