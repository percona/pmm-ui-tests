Feature('Tests for: "MongoDB PBM Details" dashboard');

BeforeSuite(async ({ I, locationsAPI, inventoryAPI, scheduledAPI }) => {
  const backupTypes = [
    { cluster: 'sharded', mode: scheduledAPI.backupModes.pitr },
    { cluster: 'replicaset', mode: scheduledAPI.backupModes.snapshot}
  ]

  for (const backupType of backupTypes) {
    const service = await inventoryAPI.getServiceDetailsByPartialDetails({ cluster: backupType.cluster, service_name: 'rs101' });
    console.log(service.service_id);
    const location = {
      name: `mongo-location-${backupType.cluster}`,
      description: `test description ${backupType.cluster}`,
    };

    const locationId = await locationsAPI.createStorageLocation(
      location.name,
      locationsAPI.storageType.s3,
      backupType.cluster === 'sharded' ? locationsAPI.storageLocationConnectionShardedCluster : locationsAPI.storageLocationConnectionReplicaset,
      location.description,
    );

    const snapshotSchedule = {
      service_id: service.service_id,
      location_id: locationId,
      name: `test_schedule_On_Demand_${backupType.mode}`,
      mode: backupType.mode,
      cron_expression: "* * * * *",
    };
    await scheduledAPI.createScheduledBackup(snapshotSchedule);
  }
  // Wait for scheduled backup to be done.
  I.wait(60);
});

AfterSuite(async ({ scheduledAPI, locationsAPI }) => {
  await scheduledAPI.clearAllSchedules();
  await locationsAPI.clearAllLocations();
});

Before(async ({ I }) => {
  await I.Authorize();
})

const backupTypes = [
  { mode: 'pitr', cluster: "sharded", service_name: 'rs101' },
  { mode: 'snapshot', cluster: "replicaset", service_name: 'rs101' }
]

Data(backupTypes).Scenario('PMM-T2036 - Verify MongoDB PBM dashboard', async ({ I, dashboards, current, dashboardPage }) => {
  console.log(current);
  const url = I.buildUrlWithParams(dashboards.mongodbPBMDetailsDashboard.url, {
    from: 'now-5m',
    cluster: current.cluster,
  });

  I.amOnPage(url);
  dashboardPage.waitForDashboardOpened();
  await dashboards.mongodbPBMDetailsDashboard.verifyBackupConfiguredValue('Yes');
  await dashboardPage.expandEachDashboardRow();
  await dashboardPage.verifyMetricsExistence(dashboards.mongodbPBMDetailsDashboard.metrics);
  await dashboardPage.verifyThereAreNoGraphsWithoutData();
});
