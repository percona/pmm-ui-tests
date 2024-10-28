const { SERVICE_TYPE } = require('../helper/constants');

Feature('PMM upgrade tests for mongo backup').retry(1);

const { locationsAPI, scheduledAPI } = inject();
const mongoServiceName = 'mongo-backup-upgrade';

const location = {
  name: 'upgrade-location',
  description: 'upgrade-location description',
  ...locationsAPI.storageLocationConnection,
};
const backupName = 'upgrade_backup_test';
const scheduleName = 'upgrade_schedule';
const scheduleSettings = {
  cron_expression: '*/20 * * * *',
  name: scheduleName,
  mode: scheduledAPI.backupModes.snapshot,
  description: '',
  retry_interval: '30s',
  retries: 0,
  enabled: true,
  retention: 1,
};

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'Create MongoDB backups data to check after upgrade @pre-mongo-backup-upgrade',
  async ({
    I, settingsAPI, locationsAPI, backupAPI, scheduledAPI, inventoryAPI, backupInventoryPage, scheduledPage, credentials,
  }) => {
    if (!await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MONGODB, mongoServiceName)) {
      await I.say(await I.verifyCommand(`docker exec rs101 pmm-admin add mongodb --port=27017 --username=${credentials.mongoReplicaPrimaryForBackups.username} --password=${credentials.mongoReplicaPrimaryForBackups.password} --service-name=${mongoServiceName} --replication-set=rs --cluster=rs`));
    }

    await settingsAPI.changeSettings({ backup: true });
    await locationsAPI.clearAllLocations(true);
    const locationId = await locationsAPI.createStorageLocation(
      location.name,
      locationsAPI.storageType.s3,
      locationsAPI.storageLocationConnection,
      location.description,
    );

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MONGODB, mongoServiceName);
    const backupId = await backupAPI.startBackup(backupName, service_id, locationId);

    // Every 20 mins schedule
    const schedule = {
      service_id,
      location_id: locationId,
      ...scheduleSettings,
    };

    await scheduledAPI.createScheduledBackup(schedule);

    /** waits and success check grouped together to speedup test */
    await backupAPI.waitForBackupFinish(backupId);
    // await backupAPI.waitForBackupFinish(null, schedule.name, 240);
    backupInventoryPage.openInventoryPage();
    backupInventoryPage.verifyBackupSucceeded(backupName);
    scheduledPage.openScheduledBackupsPage();
    I.waitForVisible(scheduledPage.elements.scheduleName(schedule.name), 20);
  },
).retry(0);

Scenario(
  '@PMM-T1505 @PMM-T971 - The scheduled job still exists and remains enabled after the upgrade @post-mongo-backup-upgrade',
  async ({ I, scheduledPage }) => {
    await scheduledPage.openScheduledBackupsPage();
    await I.waitForVisible(scheduledPage.elements.toggleByName(scheduleName));
    I.seeAttributesOnElements(scheduledPage.elements.toggleByName(scheduleName), { checked: true });

    // Verify settings for scheduled job
    I.seeTextEquals('Every 20 minutes', scheduledPage.elements.frequencyByName(scheduleName));
    I.seeTextEquals('MongoDB', scheduledPage.elements.scheduleVendorByName(scheduleName));
    I.seeTextEquals('Full', scheduledPage.elements.scheduleTypeByName(scheduleName));
    I.seeTextEquals(`${location.name} (S3)`, scheduledPage.elements.scheduleLocationByName(scheduleName));
    I.seeTextEquals('1 backup', scheduledPage.elements.retentionByName(scheduleName));

    // Disable schedule
    I.click(scheduledPage.buttons.enableDisableByName(scheduleName));
    await I.waitForVisible(scheduledPage.elements.toggleByName(scheduleName));
    I.seeAttributesOnElements(scheduledPage.elements.toggleByName(scheduleName), { checked: null });
  },
).retry(0);

Scenario(
  '@PMM-T1506 - Storage Locations exist after upgrade @post-mongo-backup-upgrade',
  async ({ I, locationsPage }) => {
    locationsPage.openLocationsPage();
    I.waitForVisible(locationsPage.buttons.actionsMenuByName(location.name), 2);
    I.click(locationsPage.buttons.actionsMenuByName(location.name));
    I.seeElement(locationsPage.buttons.deleteByName(location.name));
    I.seeElement(locationsPage.buttons.editByName(location.name));
    I.seeTextEquals(locationsPage.locationType.s3, locationsPage.elements.typeCellByName(location.name));
    I.seeTextEquals(location.endpoint, locationsPage.elements.endpointCellByName(location.name));
  },
);

Scenario(
  '@PMM-T1504 - The user is able to do a backup for MongoDB after upgrade @post-mongo-backup-upgrade',
  async ({
    locationsAPI, inventoryAPI, backupAPI, backupInventoryPage,
  }) => {
    const backupName = 'backup_after_update';

    const { location_id } = await locationsAPI.getLocationDetails(location.name);
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MONGODB, mongoServiceName);
    const backupId = await backupAPI.startBackup(backupName, service_id, location_id);

    await backupAPI.waitForBackupFinish(backupId);
    backupInventoryPage.openInventoryPage();
    backupInventoryPage.verifyBackupSucceeded(backupName);
  },
);

Scenario(
  '@PMM-T1503 PMM-T970 - The user is able to do a restore for MongoDB after the upgrade @post-mongo-backup-upgrade',
  async ({
    I, backupInventoryPage, restorePage, credentials,
  }) => {
    const replica = await I.getMongoClient({
      username: credentials.mongoReplicaPrimaryForBackups.username,
      password: credentials.mongoReplicaPrimaryForBackups.password,
      port: credentials.mongoReplicaPrimaryForBackups.port,
    });

    try {
      let collection = replica.db('test').collection('e2e');

      await I.say('I create test record in MongoDB after backup');
      await collection.insertOne({ number: 2, name: 'Anna' });

      backupInventoryPage.openInventoryPage();
      backupInventoryPage.startRestore(backupName);
      await restorePage.waitForRestoreSuccess(backupName);

      await I.say('I search for the record after MongoDB restored from backup');
      collection = replica.db('test').collection('e2e');
      const record = await collection.findOne({ number: 2, name: 'Anna' });

      I.assertEqual(record, null, `Was expecting to not have a record ${JSON.stringify(record, null, 2)} after restore operation`);
    } finally {
      await replica.close();
    }
  },
).retry(0);
