Feature('Monitoring SSL/TLS MongoDB instances');

Before(async ({ I, settingsAPI }) => {
  // await I.Authorize();
});

Scenario(
  'PMM-T1350 Verify that MySQL exporter cannot be added by pmm-admin add mysql with --log-level=fatal',
  async ({I}) => {
    await I.verifyCommand('pmm-admin add mysql --username=root --password=root-password --log-level=fatal 2>&1 | grep "error: --log-level must be one of \\"debug\\",\\"info\\",\\"warn\\",\\"error\\" but got \\"fatal\\""');
  }
);

