const { I } = inject();
const BaseDashboardPage = require('../BaseDashboard');

module.exports = {
  ...BaseDashboardPage,
  url: '',
  elements: {
    minNodeUptimeValue: '//*[@title="Min Node Uptime"]',
    minDdUptimeValue: '//*[@title="Min DB Uptime"]',
    diskSpaceTotalValue: '//*[@title="Disk Space Total"]',
    diskReadsValue: '//*[@title="Disk Reads"]',
    diskWritesValue: '//*[@title="Disk Writes"]',

    databaseConnectionValue: '//*[@title="Database Connection"]',
    databaseQueryValue: '//*[@title="Database Query/s (QPS)"]',
    advisorCheckValue: '//*[@data-testid="db-check-panel-home"]',

  },
  fields: {},
  buttons: {},
  messages: {
  },
  vacuumDashboardPostgres: {
    url: 'graph/d/postgres_vacuum_monitoring/postgresql-vacuum-monitoring?orgId=1&refresh=10s',
  },
};
