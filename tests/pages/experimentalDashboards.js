module.exports = {
  url: '',
  elements: {
    barValue: '//div[@data-testid="data-testid Bar gauge value"]',
    neverRunField: '//span[contains(text(), "Never")]',
  },
  fields: {},
  buttons: {},
  messages: {
  },
  vacuumDashboardPostgres: {
    url: 'graph/d/postgres_vacuum_monitoring/postgresql-vacuum-monitoring?orgId=1&refresh=10s',
  },
};
