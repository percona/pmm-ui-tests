const { I } = inject();

const artifactCell = (name) => `//tr[td[contains(text(), "${name}")]]`;

module.exports = {
  url: 'graph/backup/restore',
  elements: {
    noData: '$table-no-data',
    modalHeader: '$modal-header',
    modalContent: '$modal-content',
    backupStatusByName: (name) => locate('$statusMsg').inside(artifactCell(name)),
    backupPendingStatusByName: (name) => locate('$statusPending').inside(artifactCell(name)),
    backupStatusIconByName: (name) => locate('$statusMsg').inside(artifactCell(name)).find('div'),
    targetServiceByName: (name) => locate('//td[6]').inside(artifactCell(name)),
    startedAtByName: (name) => locate('//td[4]').inside(artifactCell(name)),
    finishedAtByName: (name) => locate('//td[5]').inside(artifactCell(name)),
    logsByName: (name) => locate('span').withText('Logs').inside(artifactCell(name)),
    logsText: locate('$modal-content').find('pre'),
  },
  buttons: {},
  fields: {},
  messages: {},
  locationType: {},

  async waitForRestoreSuccess(backupName) {
    I.amOnPage(this.url);
    I.waitForVisible(this.elements.backupStatusByName(backupName), 180);
    I.waitForInvisible(this.elements.backupPendingStatusByName(backupName), 180);
    const similarRestores = await I.grabNumberOfVisibleElements(this.elements.backupStatusByName(backupName));

    for (let i = 1; i <= similarRestores; i++) {
      I.waitForVisible(this.elements.backupStatusByName(backupName).at(i), 180);
      I.seeAttributesOnElements(this.elements.backupStatusIconByName(backupName).at(i), { 'data-testid': 'success-icon' });
    }
  },

  waitForRestoreFailure(backupName) {
    I.amOnPage(this.url);
    I.waitForVisible(this.elements.backupStatusByName(backupName), 180);
    I.seeAttributesOnElements(this.elements.backupStatusIconByName(backupName), { 'data-testid': 'fail-icon' });
  },
};
