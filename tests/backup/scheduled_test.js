const { locationsPage } = inject();

const location = {
  name: 'mongo-location for scheduling',
  description: 'test description',
  ...locationsPage.mongoStorageLocation,
};

let locationId;
let serviceId;

const mongoServiceName = 'mongo-rs';

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

  // await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0`,
  //   'MongoDB Service added.');
});

Before(async ({
  I, settingsAPI, scheduledPage, inventoryAPI,
}) => {
  const { service_id: serviceId } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
  const c = await I.mongoGetCollection('test', 'e2e');

  await c.findOneAndDelete({ number: 2, name: 'Anna' });

  await I.Authorize();
  await settingsAPI.changeSettings({ backup: true });
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
  'PMM-T954  Verify validation errors for retention @backup',
  async ({
    I, scheduledPage,
  }) => {
    const scheduleName = 'schedule';

    scheduledPage.openScheduleBackupModal();
    scheduledPage.selectDropdownOption(scheduledPage.fields.serviceNameDropdown, mongoServiceName);
    I.fillField(scheduledPage.fields.backupName, scheduleName);
    scheduledPage.selectDropdownOption(scheduledPage.fields.locationDropdown, location.name);
    I.seeInField(scheduledPage.fields.retention, 7);

    // clearField method doesn't work for this field
    I.usePlaywrightTo('clear field', async ({ page }) => {
      await page.fill(I.useDataQA('retention-number-input'), '');
    });
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

    I.waitForVisible(scheduledPage.elements.retentionByName(scheduleName), 20);
    I.seeTextEquals('Unlimited', scheduledPage.elements.retentionByName(scheduleName));
  },
);

Scenario(
  'PMM-T909 Verify user can update created scheduled backup @backup',
  async ({
    I, scheduledPage, scheduledAPI, inventoryAPI,
  }) => {
    const newScheduleName = 'updated schedule';
    const newScheduleDescr = 'new description';
    const schedule = {
      service_id: serviceId,
      location_id: locationId,
      cron_expression: '0 0 * * *',
      name: 'schedule for update',
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

    // clearField method doesn't work for this field
    I.usePlaywrightTo('clear field', async ({ page }) => {
      await page.fill(I.useDataQA('retention-number-input'), '');
    });
    I.fillField(scheduledPage.fields.retention, '1');
    I.seeTextEquals('', scheduledPage.elements.retentionValidation);

    I.click(scheduledPage.buttons.createSchedule);

    I.waitForVisible(scheduledPage.elements.scheduleName(newScheduleName), 20);
    I.seeTextEquals('1 backup', scheduledPage.elements.retentionByName(newScheduleName));
  },
);

Scenario.only(
  'PMM-T928 Verify user can restore from a scheduled backup @backup',
  async ({
    I, scheduledPage, scheduledAPI,
  }) => {
    const schedule = {
      service_id: serviceId,
      location_id: locationId,
      cron_expression: '* * * * *',
      name: 'schedule for restore',
      description: '',
      retry_interval: '30s',
      retries: 0,
      enabled: true,
      retention: 1,
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

    // clearField method doesn't work for this field
    I.usePlaywrightTo('clear field', async ({ page }) => {
      await page.fill(I.useDataQA('retention-number-input'), '');
    });
    I.fillField(scheduledPage.fields.retention, '1');
    I.seeTextEquals('', scheduledPage.elements.retentionValidation);

    I.click(scheduledPage.buttons.createSchedule);

    I.waitForVisible(scheduledPage.elements.scheduleName(newScheduleName), 20);
    I.seeTextEquals('1 backup', scheduledPage.elements.retentionByName(newScheduleName));
  },
);
