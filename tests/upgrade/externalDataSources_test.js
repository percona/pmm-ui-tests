Feature('PMM upgrade tests for external data sources');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario('PMM-T2018 - Verify internal clickhouse is not running when using external clickhouse @pre-external-data-sources-upgrade @post-external-data-sources-upgrade', async ({ I }) => {
  const response = await I.DockerContainerExec('pmm-server', 'supervisorctl status');

  I.assertFalse(response.includes('clickhouse'), 'Clickhouse should not run on pmm server!');
});
