const { I } = inject();

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

  async vacuumAnalyzeTables(tables) {
    for await (const table of tables.values()) {
      if (table.includes('film_testing') || table.includes('dvdrental')) {
        await I.say(table);
        await I.verifyCommand(`sudo docker exec pgsql_vacuum_db psql -U postgres -d dvdrental -c 'VACUUM  ( ANALYZE ) ${table.trim()}'`);
      }
    }
  }
};
