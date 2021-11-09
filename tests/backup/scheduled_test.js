const { locationsPage } = inject();

const location = {
  name: 'mongo-location for scheduling',
  description: 'test description',
  ...locationsPage.mongoStorageLocation,
};

let locationId;
let serviceId;

const mongoServiceName = 'mongo-backup-schedule';
const schedules = new DataTable(['cronExpression', 'name', 'description']);

schedules.add(['30 8 * * *', 'schedule daily', 'At 08:30 AM']);
schedules.add(['0 0 * * 2', 'schedule weekly', 'At 12:00 AM, only on Tuesday']);
schedules.add(['0 0 1 * *', 'schedule monthly', 'At 12:00 AM, on day 1 of the month']);
schedules.add(['0 1 1 9 2', 'schedule odd', 'At 01:00 AM, on day 1 of the month, and on Tuesday, only in September']);

Feature('BM: Scheduled backups');

BeforeSuite(async ({
  I, backupAPI, locationsAPI, settingsAPI,
}) => {
  await settingsAPI.changeSettings({ backup: true });
  await backupAPI.clearAllArtifacts();
  await locationsAPI.clearAllLocations(true);
  locationId = await locationsAPI.createStorageLocation(location);
  await I.mongoConnectReplica({
    username: 'admin',
    password: 'password',
  });

  I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0`));
});

Before(async ({
  I, settingsAPI, scheduledPage, inventoryAPI, scheduledAPI,
}) => {
  const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);

  serviceId = service_id;
  const c = await I.mongoGetCollection('test', 'e2e');

  await c.deleteMany({ number: 2 });

  await I.Authorize();
  await settingsAPI.changeSettings({ backup: true });
  await scheduledAPI.clearAllSchedules();
  await scheduledPage.openScheduledBackupsPage();
});

AfterSuite(async ({
  I,
}) => {
  await I.mongoDisconnect();
});

Scenario(
  'Verify message about no scheduled backups @backup',
  async ({
    I, scheduledPage,
  }) => {
    I.waitForText('No scheduled backups found', 30, scheduledPage.elements.noData);
  },
);

Scenario(
  'PMM-T902 Verify user is not able to schedule a backup without storage location @backup',
  async ({
    I, scheduledPage,
  }) => {
    const scheduleName = 'schedule';

    scheduledPage.openScheduleBackupModal();
    scheduledPage.selectDropdownOption(scheduledPage.fields.serviceNameDropdown, mongoServiceName);
    I.seeTextEquals(mongoServiceName, scheduledPage.elements.selectedService);
    I.waitForValue(scheduledPage.fields.vendor, 'MongoDB', 5);

    scheduledPage.selectDropdownOption(scheduledPage.fields.locationDropdown, location.name);
    I.seeTextEquals(location.name, scheduledPage.elements.selectedLocation);

    I.seeAttributesOnElements(scheduledPage.buttons.createSchedule, { disabled: true });
    I.fillField(scheduledPage.fields.backupName, scheduleName);
    I.seeAttributesOnElements(scheduledPage.buttons.createSchedule, { disabled: null });
  },
);

Scenario(
  'PMM-T954 PMM-T952 PMM-T956 PMM-T958 Verify validation errors for retention @backup',
  async ({
    I, scheduledPage,
  }) => {
    const scheduleName = 'schedule';

    scheduledPage.openScheduleBackupModal();
    scheduledPage.selectDropdownOption(scheduledPage.fields.serviceNameDropdown, mongoServiceName);
    I.fillField(scheduledPage.fields.backupName, scheduleName);
    scheduledPage.selectDropdownOption(scheduledPage.fields.locationDropdown, location.name);
    I.seeInField(scheduledPage.fields.retention, 7);

    scheduledPage.clearRetentionField();
    I.seeTextEquals(scheduledPage.messages.requiredField, scheduledPage.elements.retentionValidation);

    I.fillField(scheduledPage.fields.retention, 'q');
    I.seeTextEquals(scheduledPage.messages.requiredField, scheduledPage.elements.retentionValidation);

    I.fillField(scheduledPage.fields.retention, '-1');
    I.seeTextEquals(scheduledPage.messages.outOfRetentionRange, scheduledPage.elements.retentionValidation);

    I.fillField(scheduledPage.fields.retention, '100');
    I.seeTextEquals(scheduledPage.messages.outOfRetentionRange, scheduledPage.elements.retentionValidation);

    I.fillField(scheduledPage.fields.retention, '0.5');
    I.seeTextEquals('', scheduledPage.elements.retentionValidation);

    I.click(scheduledPage.buttons.createSchedule);

    I.verifyPopUpMessage(scheduledPage.messages.backupScheduled);
    I.waitForVisible(scheduledPage.elements.retentionByName(scheduleName), 20);
    I.seeTextEquals('Unlimited', scheduledPage.elements.retentionByName(scheduleName));
  },
);

Scenario(
  'PMM-T909 PMM-T952 PMM-T956 Verify user can update created scheduled backup @backup',
  async ({
    I, scheduledPage, scheduledAPI,
  }) => {
    const newScheduleName = 'updated schedule';
    const newScheduleDescr = 'new description';
    const schedule = {
      service_id: serviceId,
      location_id: locationId,
      cron_expression: '0 0 * * *',
      name: 'schedule for update',
      mode: scheduledAPI.backupModes.snapshot,
      description: 'description',
      retry_interval: '30s',
      retries: 0,
      enabled: true,
      retention: 6,
    };

    await scheduledAPI.createScheduledBackup(schedule);

    await scheduledPage.openScheduledBackupsPage();
    I.click(scheduledPage.buttons.deleteByName(schedule.name));

    I.waitForVisible(scheduledPage.fields.backupName, 30);
    I.clearField(scheduledPage.fields.backupName);
    I.fillField(scheduledPage.fields.backupName, newScheduleName);

    I.clearField(scheduledPage.fields.description);
    I.fillField(scheduledPage.fields.description, newScheduleDescr);

    I.seeInField(scheduledPage.fields.retention, 6);

    scheduledPage.clearRetentionField();
    I.fillField(scheduledPage.fields.retention, '1');
    I.seeTextEquals('', scheduledPage.elements.retentionValidation);

    I.click(scheduledPage.buttons.createSchedule);

    I.waitForVisible(scheduledPage.elements.scheduleName(newScheduleName), 20);
    I.seeTextEquals('1 backup', scheduledPage.elements.retentionByName(newScheduleName));
  },
);

Scenario(
  'PMM-T922 Verify user can schedule a backup for MongoDB with replica @backup',
  async ({
    I, backupInventoryPage, scheduledAPI, backupAPI, scheduledPage,
  }) => {
    const schedule = {
      name: 'schedule for backup',
      retention: 1,
    };

    scheduledPage.openScheduleBackupModal();
    scheduledPage.selectDropdownOption(scheduledPage.fields.serviceNameDropdown, mongoServiceName);
    I.fillField(scheduledPage.fields.backupName, schedule.name);
    scheduledPage.selectDropdownOption(scheduledPage.fields.locationDropdown, location.name);
    scheduledPage.selectDropdownOption(scheduledPage.fields.everyDropdown, 'Minute');
    scheduledPage.clearRetentionField();
    I.fillField(scheduledPage.fields.retention, schedule.retention);
    I.click(scheduledPage.buttons.createSchedule);
    I.waitForVisible(scheduledPage.elements.scheduleName(schedule.name), 20);
    I.seeTextEquals('1 backup', scheduledPage.elements.retentionByName(schedule.name));

    await backupAPI.waitForBackupFinish(null, schedule.name, 300);
    const { scheduled_backup_id } = await scheduledAPI.getScheduleIdByName(schedule.name);

    await scheduledAPI.disableScheduledBackup(scheduled_backup_id);

    backupInventoryPage.verifyBackupSucceeded(schedule.name);
  },
);

Data(schedules).Scenario(
  'PMM-T899 PMM-T903 PMM-T904 PMM-T905 Verify user can create daily scheduled backup @backup',
  async ({
    scheduledPage, scheduledAPI, current,
  }) => {
    const schedule = {
      service_id: serviceId,
      location_id: locationId,
      cron_expression: current.cronExpression,
      name: current.name,
      description: current.description,
      mode: scheduledAPI.backupModes.snapshot,
      retry_interval: '30s',
      retries: 0,
      retention: 6,
      enabled: true,
    };
    const scheduleDetails = {
      name: current.name,
      vendor: 'MongoDB',
      description: current.description,
      retention: 6,
      type: 'Full',
      location: 'mongo-location for scheduling',
      dataModel: 'Logical',
      cronExpression: current.cronExpression,
    };

    await scheduledAPI.createScheduledBackup(schedule);
    await scheduledPage.openScheduledBackupsPage();
    await scheduledPage.verifyBackupValues(scheduleDetails);
  },
);
