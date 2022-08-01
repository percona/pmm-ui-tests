Feature('pmm-admin remove tests');

Scenario('PMM-T1286 - Verify service removal without specifying service name/service id @cli', async ({ I }) => {
  await I.verifyCommand(
    'docker exec pmm-client pmm-admin add mysql --username=root --password=ps mysql-remove mysql:3306',
    'MySQL Service added.',
  );

  await I.verifyCommand(
    'docker exec pmm-client pmm-admin remove mysql',
    'Service removed.',
  );
});