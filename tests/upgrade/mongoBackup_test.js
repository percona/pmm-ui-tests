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

const localStorageLocationName = 'mongoLocation';
let localStorageLocationId;
let locationId;

BeforeSuite(async ({
  I, locationsAPI, settingsAPI,
}) => {
  await settingsAPI.changeSettings({ backup: true });
  await locationsAPI.clearAllLocations(true);
  localStorageLocationId = await locationsAPI.createStorageLocation(
    localStorageLocationName,
    locationsAPI.storageType.localClient,
    locationsAPI.localStorageDefaultConfig,
  );
  locationId = await locationsAPI.createStorageLocation(
    location.name,
    locationsAPI.storageType.s3,
    locationsAPI.storageLocationConnection,
    location.description,
  );
});

Before(async ({
  I, settingsAPI, backupAPI, backupInventoryPage,
}) => {
  await I.Authorize();
  await settingsAPI.changeSettings({ backup: true });
  await backupAPI.clearAllArtifacts();
  await backupInventoryPage.openInventoryPage();
});

Scenario(
  'Create MongoDB backups data to check after upgrade @pre-mongo-backup-upgrade',
  async ({
    I, settingsAPI, locationsAPI, backupAPI, scheduledAPI, inventoryAPI, backupInventoryPage, scheduledPage, credentials,
  }) => {
    if (!await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MONGODB, mongoServiceName)) {
      await I.say(await I.verifyCommand(`docker exec rs101 pmm-admin add mongodb --port=27017 --username=${credentials.mongoReplicaPrimaryForBackups.username} --password=${credentials.mongoReplicaPrimaryForBackups.password} --service-name=${mongoServiceName} --replication-set=rs --cluster=rs`));
    }

    const backupName = 'mongo_backup_test';

    I.click(backupInventoryPage.buttons.openAddBackupModal);

    backupInventoryPage.selectDropdownOption(backupInventoryPage.fields.serviceNameDropdown, mongoServiceName);
    backupInventoryPage.selectDropdownOption(backupInventoryPage.fields.locationDropdown, location.name);
    I.fillField(backupInventoryPage.fields.backupName, backupName);
    // TODO: uncomment when PMM-10899 will be fixed
    // I.fillField(backupInventoryPage.fields.description, 'test description');
    I.click(backupInventoryPage.buttons.addBackup);
    I.waitForVisible(backupInventoryPage.elements.pendingBackupByName(backupName), 10);
    backupInventoryPage.verifyBackupSucceeded(backupName);

    const artifactName = await I.grabTextFrom(backupInventoryPage.elements.artifactName(backupName));
    const artifact = await backupAPI.getArtifactByName(artifactName);
  },
).retry(0);

Scenario.skip(
  'Run queries for MongoDB after upgrade @post-mongo-backup-upgrade',
  async ({ I }) => {
    const col = await I.mongoCreateCollection('local', 'e2e');

    await col.insertOne({ a: '111' });
    await col.findOne();
  },
);

Scenario(
  '@PMM-T1505 @PMM-T971 - The scheduled job still exists and remains enabled after the upgrade @post-mongo-backup-upgrade',
  async ({ I, scheduledPage }) => {
    await scheduledPage.openScheduledBackupsPage();
    await I.waitForVisible(scheduledPage.elements.toggleByName(scheduleName));
    let isChecked = await I.grabAttributeFrom(scheduledPage.elements.toggleByName(scheduleName), 'checked');

    I.assertEqual(isChecked, '', `Element ${scheduledPage.elements.toggleByName(scheduleName).xpath} is checked, but should not be.`);

    // Verify settings for scheduled job
    I.seeTextEquals('Every 20 minutes', scheduledPage.elements.frequencyByName(scheduleName));
    I.seeTextEquals('MongoDB', scheduledPage.elements.scheduleVendorByName(scheduleName));
    I.seeTextEquals('Full', scheduledPage.elements.scheduleTypeByName(scheduleName));
    I.seeTextEquals(`${location.name} (S3)`, scheduledPage.elements.scheduleLocationByName(scheduleName));
    I.seeTextEquals('1 backup', scheduledPage.elements.retentionByName(scheduleName));

    // Disable schedule
    I.click(scheduledPage.buttons.enableDisableByName(scheduleName));
    await I.waitForVisible(scheduledPage.elements.toggleByName(scheduleName));
    isChecked = await I.grabAttributeFrom(scheduledPage.elements.toggleByName(scheduleName), 'checked');

    I.assertEqual(isChecked, '', `Element ${scheduledPage.elements.toggleByName(scheduleName).xpath} is checked, but should not be.`);
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
      I.wait(60);

      await I.say('I search for the record after MongoDB restored from backup');
      collection = replica.db('test').collection('e2e');

      const record = await collection.findOne({ number: 2, name: 'Anna' });

      I.assertEqual(record, null, `Was expecting to not have a record ${JSON.stringify(record, null, 2)} after restore operation`);
    } finally {
      await replica.close();
    }
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


