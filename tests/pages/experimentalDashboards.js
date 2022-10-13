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
      if (table.includes('film')
      || table.includes('actor')
      || table.includes('store')
      || table.includes('address')
      || table.includes('category')
      || table.includes('city')
      || table.includes('country')
      || table.includes('customer')
      || table.includes('inventory')
      || table.includes('language')
      || table.includes('rental')
      || table.includes('staff')
      || table.includes('payment')
      ) {
        await I.say(table);
        await I.verifyCommand(`sudo docker exec pgsql_vacuum_db psql -U postgres -d dvdrental -c 'VACUUM  ( ANALYZE ) ${table.trim()}'`);
      }
    }
  }
};
