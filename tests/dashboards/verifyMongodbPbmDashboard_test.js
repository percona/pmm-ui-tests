Feature('Tests for: "MongoDB PBM Details" dashboard');

const backupTypes = [
  { mode: 'pitr', cluster: 'sharded', service_name: 'rs101' },
  { mode: 'snapshot', cluster: 'replicaset', service_name: 'rs101' },
];

BeforeSuite(async ({
  I, locationsAPI, inventoryAPI, scheduledAPI,
}) => {
  for (const backupType of backupTypes) {
    const service = await inventoryAPI.getServiceDetailsByPartialDetails({ cluster: backupType.cluster, service_name: 'rs101' });
    const location = {
      name: `mongo-location-${backupType.cluster}`,
      description: `test description ${backupType.cluster}`,
    };

    console.log(service.node_name);
    const node = await inventoryAPI.getNodeByName(service.node_name);
    console.log(node);

    const storageLocation = {
      endpoint: backupType.cluster === 'sharded' ? `http://${process.env.VM_CLIENT_IP_PSMDB_SHARDED}:9001` : `http://${process.env.VM_CLIENT_IP_MYSQL}:9001`,
      bucket_name: 'bcp',
      access_key: 'minio1234',
      secret_key: 'minio1234',
    };

    const locationId = await locationsAPI.createStorageLocation(
      location.name,
      locationsAPI.storageType.s3,
      storageLocation,
      location.description,
    );

    const snapshotSchedule = {
      service_id: service.service_id,
      location_id: locationId,
      name: `test_schedule_On_Demand_${backupType.mode}`,
      mode: backupType.mode,
      cron_expression: '* * * * *',
    };

    await scheduledAPI.createScheduledBackup(snapshotSchedule);
  }

  // Wait for scheduled backup to be done.
  I.wait(90);
});

AfterSuite(async ({ scheduledAPI, locationsAPI }) => {
  await scheduledAPI.clearAllSchedules();
  await locationsAPI.clearAllLocations();
});

Before(async ({ I }) => {
  await I.Authorize();
});

Data(backupTypes).Scenario('PMM-T2036 - Verify MongoDB PBM dashboard @nightly', async ({
  I, dashboards, current, dashboardPage,
}) => {
  const url = I.buildUrlWithParams(dashboards.mongodbPBMDetailsDashboard.url, {
    from: 'now-5m',
    cluster: current.cluster,
  });

  I.amOnPage(url);
  dashboardPage.waitForDashboardOpened();
  await dashboards.mongodbPBMDetailsDashboard.verifyBackupConfiguredValue('Yes');
  await dashboards.mongodbPBMDetailsDashboard.verifyPitrEnabledValue(current.mode === 'pitr' ? 'Yes' : 'No');
  await dashboardPage.expandEachDashboardRow();
  await dashboardPage.verifyMetricsExistence(dashboards.mongodbPBMDetailsDashboard.metrics);
  await dashboardPage.verifyThereAreNoGraphsWithoutData();
});
