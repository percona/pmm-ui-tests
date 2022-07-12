const assert = require('assert');

Feature('Test PMM server with srv local folder');

BeforeSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-srv.yml up -d');
  await I.verifyCommand('docker exec pmm-client sh -c "pmm-admin add mysql --username=root --password=pass --query-source=perfschema  mysql5.7 mysql5.7:3306"');
  await I.wait(60);
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-srv.yml down -v');
});

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1243 Verify PMM Server without data container @srv',
  async ({
    I,
  }) => {
    await I.wait(120);

    //    assert.ok(count > 0, `The queries for service ${service} instance do NOT exist, check QAN Data`);
  },
);
