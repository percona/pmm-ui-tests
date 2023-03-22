const { I } = inject();

const artifactCell = (name) => `//tr[td[contains(text(), "${name}")]]`;

module.exports = {
  url: 'graph/backup/restore',
  elements: {
    noData: '$table-no-data',
    modalHeader: '$modal-header',
    backupStatusByName: (name) => locate('$statusMsg').inside(artifactCell(name)),
    backupStatusIconByName: (name) => locate('$statusMsg').inside(artifactCell(name)).find('div'),
    targetServiceByName: (name) => locate('td').at(6).inside(artifactCell(name)),

  },
  buttons: {},
  fields: {},
  messages: {},
  locationType: {},

  waitForRestoreSuccess(backupName) {
    I.amOnPage(this.url);
    I.waitForVisible(this.elements.backupStatusByName(backupName), 180);
    I.seeAttributesOnElements(this.elements.backupStatusIconByName(backupName), { 'data-testid': 'success-icon' });
  },
};
