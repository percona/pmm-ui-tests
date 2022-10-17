const { I } = inject();

module.exports = {
  url: '',
  elements: {
    barValue: '//div[@data-testid="data-testid Bar gauge value"]',
    neverRunField: '//span[contains(text(), "Never")]',
    lastVacuumValue: '//div[contains(@class, "react-grid-item")][6]//div[contains(text(), "dvdrental")]//following-sibling::*',
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
        await I.verifyCommand(`sudo docker exec pgsql_vacuum_db psql -U postgres -d dvdrental -c 'VACUUM  ( ANALYZE ) ${table.trim()}'`);
      }
    }
  },
  async waitForLastVacuumValues(timeoutInSeconds) {
    for (let index = 0; index <= timeoutInSeconds; index++) {
      const lastVacuumValues = await I.grabTextFromAll(this.elements.lastVacuumValue);

      for await (const lastVacuumValue of lastVacuumValues.values()) {
        if (!(new Date(lastVacuumValue).toString() === 'Invalid Date')) {
          I.say(`Date of vacuum is: ${new Date(lastVacuumValue)}`);

          return;
        }
      }

      await I.wait(1);

      if (index === timeoutInSeconds) {
        throw new Error('Vacuum operation never occurred.');
      }
    }
  },
};
