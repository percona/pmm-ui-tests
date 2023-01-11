Feature('Test functional related to the PostgreSQL');

const connection = {
  host: '127.0.0.1',
  port: 5437,
  user: 'postgres',
  password: 'pass+this',
  database: 'postgres',
};

Scenario(
  '@PMM-T836 Verify that databases can be deleted while PG is being monitored @not-ui-pipeline @pgsm-pmm-integration',
  async ({ I, grafanaAPI }) => {
    const dbName = 'testdatabase';
    const container = 'pgsql_pgsm_14';

    await I.verifyCommand(`docker exec ${container} psql -U postgres -c "CREATE DATABASE ${dbName};"`, 'CREATE DATABASE');
    await I.verifyCommand(`docker exec ${container} psql -U postgres -c "\\l" | grep -o "${dbName}"`, dbName);
    // need to wait for some time for connection otherwise test can be falsely positive
    I.wait(10);
    await I.verifyCommand(`docker exec ${container} psql -U postgres -c "DROP DATABASE ${dbName};"`);
    await I.verifyCommand(`docker exec ${container} psql -U postgres -c "\\l" | grep -o "${dbName}"`, '', 'fail');
  },
);
