// xpath used here because locate('td').withText('') method does not work correctly
const checkRow = (checkName) => `//tr[td[text()="${checkName}"]]`;
const actionButton = (checkName) => locate(checkRow(checkName)).find('td').last().find('button');

const {
  I,
} = inject();

module.exports = {
  url: 'graph/pmm-database-checks/all-checks',
  elements: {
    checkNameCell: (checkName) => locate(checkRow(checkName)).find('td').at(1),
    descriptionCellByName: (checkName) => locate(checkRow(checkName)).find('td').at(2),
    statusCellByName: (checkName) => locate(checkRow(checkName)).find('td').at(3),
    intervalCellByName: (checkName) => locate(checkRow(checkName)).find('td').at(4),
    tableBody: '$db-checks-all-checks-tbody',
    modalContent: '$modal-content',
  },
  buttons: {
    disableEnableCheck: (checkName) => locate(checkRow(checkName)).find('$check-table-loader-button'),
    openChangeInterval: (checkName) => locate(checkRow(checkName)).find('[title="Change check interval"]'),
    intervalValue: (intervalName) => locate('label').withText(intervalName),
    startDBChecks: locate('$db-check-panel-actions').find('button'),
    applyIntervalChange: '$change-check-interval-modal-save',
  },
  messages: {
    successIntervalChange: (checkName) => `Interval changed for ${checkName}`,
    changeIntervalText: (checkName) => `Set interval for ${checkName}`,
    securityChecksDone: 'All checks started running in the background',
  },
  checks: [
    {
      name: 'MySQL Version',
      description: 'This check returns warnings if MySQL, Percona Server for MySQL, or MariaDB version is not the latest one.',
      status: 'Enabled',
      interval: 'Standard',
    },
    {
      name: 'MySQL User check',
      description: 'This check returns an error if there are users not properly set.',
      status: 'Enabled',
      interval: 'Standard',
    },
  ],
  async runDBChecks() {
    I.amOnPage(this.url);
    I.waitForVisible(this.buttons.startDBChecks, 30);
    I.click(this.buttons.startDBChecks);
    I.verifyPopUpMessage(this.messages.securityChecksDone, 60);
  },
};
