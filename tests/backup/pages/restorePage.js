const { I } = inject();

const artifactCell = (name) => `//tr[td/div[contains(text(), "${name}")]]`;

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
};
