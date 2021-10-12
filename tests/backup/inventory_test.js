const assert = require('assert');

const { locationsPage } = inject();

const location = {
  name: 'mongo-location',
  description: 'test description',
  ...locationsPage.mongoStorageLocation,
};

let locationId;
let serviceId;

const mongoServiceName = 'mongo-backup-inventory';

Feature('BM: Backup Inventory');

BeforeSuite(async ({
  I, locationsAPI, settingsAPI,
}) => {
  await settingsAPI.changeSettings({ backup: true });
  await locationsAPI.clearAllLocations(true);
  locationId = await locationsAPI.createStorageLocation(location);
  await I.mongoConnectReplica({
    username: 'admin',
    password: 'password',
  });

  I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0`));
});

Before(async ({
  I, settingsAPI, backupInventoryPage, inventoryAPI, backupAPI,
}) => {
  const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);

  serviceId = service_id;

  const c = await I.mongoGetCollection('test', 'e2e');

  await c.deleteMany({ number: 2 });

  await I.Authorize();
  await settingsAPI.changeSettings({ backup: true });
  await backupAPI.clearAllArtifacts();
  await backupInventoryPage.openInventoryPage();
});

AfterSuite(async ({
  I,
}) => {
  await I.mongoDisconnect();
});

Scenario(
  'PMM-T691 Verify message about no backups in inventory @backup',
  async ({
    I, backupInventoryPage,
  }) => {
    I.waitForText('No backups found', 30, backupInventoryPage.elements.noData);
  },
);

Scenario(
  'PMM-T855 Verify user is able to perform MongoDB backup @backup',
  async ({
    I, backupInventoryPage,
  }) => {
    const backupName = 'mongo backup test';

    I.click(backupInventoryPage.buttons.openAddBackupModal);

    backupInventoryPage.selectDropdownOption(backupInventoryPage.fields.serviceNameDropdown, mongoServiceName);
    I.seeTextEquals(mongoServiceName, backupInventoryPage.elements.selectedService);
    I.waitForValue(backupInventoryPage.fields.vendor, 'MongoDB', 5);

    backupInventoryPage.selectDropdownOption(backupInventoryPage.fields.locationDropdown, location.name);
    I.seeTextEquals(location.name, backupInventoryPage.elements.selectedLocation);

    I.seeAttributesOnElements(backupInventoryPage.buttons.addBackup, { disabled: true });
    I.fillField(backupInventoryPage.fields.backupName, backupName);
    I.seeAttributesOnElements(backupInventoryPage.buttons.addBackup, { disabled: null });

    I.fillField(backupInventoryPage.fields.description, 'test description');

    I.click(backupInventoryPage.buttons.addBackup);

    I.waitForVisible(backupInventoryPage.elements.pendingBackupByName(backupName), 10);
    backupInventoryPage.verifyBackupSucceeded(backupName);
  },
);

Scenario(
  'PMM-T862 Verify user is able to perform MongoDB restore @backup',
  async ({
    I, backupInventoryPage, backupAPI, inventoryAPI, restorePage,
  }) => {
    const backupName = 'mongo restore test';
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const artifactId = await backupAPI.startBackup(backupName, service_id, locationId);

    await backupAPI.waitForBackupFinish(artifactId);

    I.refreshPage();
    backupInventoryPage.verifyBackupSucceeded(backupName);

    let c = await I.mongoGetCollection('test', 'e2e');

    await c.insertOne({ number: 2, name: 'Anna' });

    backupInventoryPage.startRestore(backupName);
    restorePage.waitForRestoreSuccess(backupName);

    c = await I.mongoGetCollection('test', 'e2e');
    const record = await c.findOne({ number: 2, name: 'Anna' });

    assert.ok(record === null, `Was expecting to not have a record ${JSON.stringify(record, null, 2)} after restore operation`);
  },
);

Scenario(
  'PMM-T910 PMM-T911 Verify delete from storage is selected by default @backup',
  async ({
    I, backupInventoryPage, backupAPI, inventoryAPI,
  }) => {
    const backupName = 'mongo artifact delete test';
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const artifactId = await backupAPI.startBackup(backupName, service_id, locationId);

    await backupAPI.waitForBackupFinish(artifactId);

    I.refreshPage();
    backupInventoryPage.verifyBackupSucceeded(backupName);

    const artifactName = await I.grabTextFrom(backupInventoryPage.elements.artifactName(backupName));

    I.click(backupInventoryPage.buttons.deleteByName(backupName));
    I.waitForVisible(backupInventoryPage.elements.forceDeleteLabel, 20);
    I.seeTextEquals(backupInventoryPage.messages.confirmDeleteText(artifactName), 'h4');
    I.seeTextEquals(backupInventoryPage.messages.forceDeleteLabelText, backupInventoryPage.elements.forceDeleteLabel);
    I.seeTextEquals(backupInventoryPage.messages.modalHeaderText, backupInventoryPage.elements.modalHeader);

    I.seeCheckboxIsChecked(backupInventoryPage.buttons.forceDeleteCheckbox);

    I.click(backupInventoryPage.buttons.confirmDelete);

    I.waitForInvisible(backupInventoryPage.buttons.deleteByName(backupName), 30);
  },
);

Scenario(
  'PMM-T928 Verify user can restore from a scheduled backup @backup',
  async ({
    I, backupInventoryPage, scheduledAPI, backupAPI, restorePage,
  }) => {
    // Every 2 mins schedule
    const schedule = {
      service_id: serviceId,
      location_id: locationId,
      cron_expression: '*/2 * * * *',
      name: 'schedule for restore',
      mode: scheduledAPI.backupModes.snapshot,
      description: '',
      retry_interval: '30s',
      retries: 0,
      enabled: true,
      retention: 1,
    };

    const scheduleId = await scheduledAPI.createScheduledBackup(schedule);

    await backupAPI.waitForBackupFinish(null, schedule.name, 240);
    await scheduledAPI.disableScheduledBackup(scheduleId);

    let c = await I.mongoGetCollection('test', 'e2e');

    await c.insertOne({ number: 2, name: 'BeforeRestore' });
    I.refreshPage();

    backupInventoryPage.verifyBackupSucceeded(schedule.name);
    backupInventoryPage.startRestore(schedule.name);
    restorePage.waitForRestoreSuccess(schedule.name);

    c = await I.mongoGetCollection('test', 'e2e');
    const record = await c.findOne({ name: 'BeforeRestore' });

    assert.ok(record === null, `Was expecting to not have a record ${JSON.stringify(record, null, 2)} after restore operation`);
  },
);
