// xpath used here because locate('td').withText('') method does not work correctly
const checkRow = (checkName) => `//tr[td[text()="${checkName}"]]`;
const actionButton = (checkName) => locate(checkRow(checkName)).find('td').last().find('button');

module.exports = {
  url: 'graph/pmm-database-checks/allChecks',
  elements: {
    checkNameCell: (checkName) => locate(checkRow(checkName)).find('td').at(1),
    descriptionCellByName: (checkName) => locate(checkRow(checkName)).find('td').at(2),
    statusCellByName: (checkName) => locate(checkRow(checkName)).find('td').at(3),
    intervalCellByName: (checkName) => locate(checkRow(checkName)).find('td').at(4),
    tableBody: '$db-checks-all-checks-tbody',
    modalContent: '$modal-content',
  },
  buttons: {
    disableEnableCheck: (checkName) => actionButton(checkName).first(),
    openChangeInterval: (checkName) => actionButton(checkName).last(),
    intervalValue: (intervalName) => locate('label').withText(intervalName),
    applyIntervalChange: '$change-check-interval-modal-save',
  },
  messages: {
    successIntervalChange: (checkName) => `Interval changed for ${checkName}`,
    changeIntervalText: (checkName) => `Set interval for ${checkName}`,
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
};
