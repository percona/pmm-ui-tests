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

Scenario(
  'Create MongoDB backups data to check after upgrade @pre-upgrade @pmm-upgrade',
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
