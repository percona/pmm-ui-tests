const { I } = inject();

const artifactCell = (name) => `//tr[td/div/span[contains(text(), "${name}")]]`;

module.exports = {
  url: 'graph/backup/restore',
  elements: {
    noData: '$table-no-data',
    modalHeader: '$modal-header',
    backupStatusByName: (name) => locate('$statusMsg').inside(artifactCell(name)),
  },
  buttons: {},
  fields: {},
  messages: {},
  locationType: {},

  waitForRestoreSuccess(backupName) {
    I.amOnPage(this.url);
    I.waitForVisible(this.elements.backupStatusByName(backupName), 180);
    I.waitForText('Success', 30, this.elements.backupStatusByName(backupName));
  },
};
