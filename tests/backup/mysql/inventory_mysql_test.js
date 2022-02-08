const { locationsPage, psMySql } = inject();
const connection = psMySql.defaultConnection;
const location = {
  name: 'mysql backups',
  description: 'MySQL backup location',
  ...locationsPage.mongoStorageLocation,
};

let locationId;
let serviceId;

const mysqlServiceName = 'mysql-with-backup';
const mysqlServiceNameToDelete = 'mysql-service-to-delete';
const mysqlCredentials = {
  host: '127.0.0.1',
  port: connection.port,
  username: connection.username,
  password: 'admin',
};

Feature('BM: MySQL Backup Inventory');

BeforeSuite(async ({
  I, locationsAPI, settingsAPI, psMySql,
}) => {
  await settingsAPI.changeSettings({ backup: true });
  await locationsAPI.clearAllLocations(true);
  locationId = await locationsAPI.createStorageLocation(location);

  psMySql.connectToPS(mysqlCredentials);

  await I.say(await I.verifyCommand(`pmm-admin add mysql --username=root --password=admin --query-source=perfschema ${mysqlServiceName}`));
  await I.say(await I.verifyCommand(`pmm-admin add mysql --username=root --password=admin --query-source=perfschema ${mysqlServiceNameToDelete}`));
});

Before(async ({
  I, settingsAPI, backupInventoryPage, inventoryAPI, backupAPI,
}) => {
  const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MYSQL_SERVICE', mysqlServiceName);

  serviceId = service_id;

  await I.Authorize();
  await settingsAPI.changeSettings({ backup: true });
  await backupAPI.clearAllArtifacts();
  await backupInventoryPage.openInventoryPage();
});

AfterSuite(async ({ psMySql }) => {
  await psMySql.disconnectFromPS();
});

Scenario(
  'PMM-T769, PMM-T920 - Verify user is able to perform MySQL backup @nightly @bm-mysql',
  async ({ I, backupInventoryPage }) => {
    const backupName = 'mysql backup test';

    I.click(backupInventoryPage.buttons.openAddBackupModal);

    backupInventoryPage.selectDropdownOption(backupInventoryPage.fields.serviceNameDropdown, mysqlServiceName);
    backupInventoryPage.selectDropdownOption(backupInventoryPage.fields.locationDropdown, location.name);
    I.fillField(backupInventoryPage.fields.backupName, backupName);
    I.fillField(backupInventoryPage.fields.description, 'test description');
    I.click(backupInventoryPage.buttons.addBackup);
    I.waitForVisible(backupInventoryPage.elements.pendingBackupByName(backupName), 10);
    backupInventoryPage.verifyBackupSucceeded(backupName);
    // TODO: add check file on AWS S3
  },
);

Scenario(
  'PMM-T862 Verify user is able to perform MySQL restore @nightly @bm-mysql',
  async ({
    I, backupInventoryPage, backupAPI, restorePage, psMySql,
  }) => {
    const backupName = 'mysql restore test';
    const tableName = 'test';

    await psMySql.deleteTable(tableName);
    const artifactId = await backupAPI.startBackup(backupName, serviceId, locationId);

    await backupAPI.waitForBackupFinish(artifactId);
    I.refreshPage();
    backupInventoryPage.verifyBackupSucceeded(backupName);
    await psMySql.createTable(tableName);
    /* connection must be closed in correct way before restore backup. Restore procedure restarts mysql service */
    await psMySql.disconnectFromPS();
    backupInventoryPage.startRestore(backupName);
    restorePage.waitForRestoreSuccess(backupName);

    psMySql.connectToPS(mysqlCredentials);
    const tableExists = await psMySql.isTableExists(tableName);

    I.assertFalse(tableExists, `Table "${tableName}" is expected to be absent after restore backup operation`);
  },
);

Scenario(
  'PMM-T910 PMM-T911 Verify delete from storage is selected by default @nightly @bm-mysql',
  async ({
    I, backupInventoryPage, backupAPI, inventoryAPI,
  }) => {
    const backupName = 'mysql artifact delete test';
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MYSQL_SERVICE', mysqlServiceName);
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
  'PMM-T810 Verify user can restore MySQL backup from a scheduled backup @nightly @bm-mysql',
  async ({
    I, backupInventoryPage, scheduledAPI, backupAPI, restorePage,
  }) => {
    // Every 2 mins schedule
    const schedule = {
      service_id: serviceId,
      location_id: locationId,
      cron_expression: '*/2 * * * *',
      name: 'for restore mysql test',
      mode: scheduledAPI.backupModes.snapshot,
      description: '',
      retry_interval: '30s',
      retries: 0,
      enabled: true,
      retention: 1,
    };
    const tableName = 'sh_test';
    const scheduleId = await scheduledAPI.createScheduledBackup(schedule);

    await psMySql.deleteTable(tableName);
    await backupAPI.waitForBackupFinish(null, schedule.name, 240);
    await scheduledAPI.disableScheduledBackup(scheduleId);

    I.refreshPage();
    await psMySql.createTable(tableName);
    backupInventoryPage.verifyBackupSucceeded(schedule.name);
    /* connection must be closed in correct way before restore backup. Restore procedure restarts mysql service */
    await psMySql.disconnectFromPS();
    backupInventoryPage.startRestore(schedule.name);
    restorePage.waitForRestoreSuccess(schedule.name);

    psMySql.connectToPS(mysqlCredentials);
    const tableExists = await psMySql.isTableExists(tableName);

    I.assertFalse(tableExists, `Table "${tableName}" is expected to be absent after restore backup operation`);
  },
);

Scenario(
  'PMM-T848 Verify service no longer exists error message during restore @nightly @bm-mysql',
  async ({
    I, backupInventoryPage, backupAPI, inventoryAPI,
  }) => {
    const backupName = 'service remove backup';
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MYSQL_SERVICE', mysqlServiceNameToDelete);
    const artifactId = await backupAPI.startBackup(backupName, service_id, locationId);

    await backupAPI.waitForBackupFinish(artifactId);
    await inventoryAPI.deleteService(service_id);

    I.refreshPage();
    backupInventoryPage.verifyBackupSucceeded(backupName);

    I.click(backupInventoryPage.buttons.restoreByName(backupName));
    I.waitForVisible(backupInventoryPage.buttons.modalRestore, 10);
    I.seeTextEquals(backupInventoryPage.messages.serviceNoLongerExists, backupInventoryPage.elements.backupModalError);
    I.seeElementsDisabled(backupInventoryPage.buttons.modalRestore);
  },
);
