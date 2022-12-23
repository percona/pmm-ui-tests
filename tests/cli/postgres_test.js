Feature('Test functional related to the PostgreSQL');
Scenario(
  '@PMM-T836 Verify that databases can be deleted while PG is being monitored @not-ui-pipeline',
  async ({ I, grafanaAPI }) => {
    const dbName = 'testdatabase7';

    await I.verifyCommand(`docker exec pmm-server psql -U postgres -c "CREATE DATABASE ${dbName};"`, 'CREATE DATABASE');
    await I.verifyCommand(`docker exec pmm-server psql -U postgres -c "\\l" | grep -o "${dbName}"`, dbName);
    // need to wait for some time for connection otherwise test can be falsely positive
    I.wait(10);
    await I.verifyCommand(`docker exec pmm-server psql -U postgres -c "DROP DATABASE ${dbName};"`);
    await I.verifyCommand(`docker exec pmm-server psql -U postgres -c "\\l" | grep -o "${dbName}"`, '', 'fail');
  },
);
