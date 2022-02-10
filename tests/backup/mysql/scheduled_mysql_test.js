const moment = require('moment');

const { locationsPage, psMySql } = inject();
const connection = psMySql.defaultConnection;
const location = {
  name: 'mysql scheduled backup location',
  description: 'MySQL location for scheduling',
  ...locationsPage.mongoStorageLocation,
};

let locationId;
let serviceId;

const mysqlServiceName = 'mysql-with-backup';
const schedules = new DataTable(['cronExpression', 'name', 'frequency']);

schedules.add(['30 8 * * *', 'schedule daily', 'At 08:30 AM']);
schedules.add(['0 0 * * 2', 'schedule weekly', 'At 12:00 AM, only on Tuesday']);
schedules.add(['0 0 1 * *', 'schedule monthly', 'At 12:00 AM, on day 1 of the month']);
schedules.add(['0 1 1 9 2', 'schedule odd', 'At 01:00 AM, on day 1 of the month, and on Tuesday, only in September']);

Feature('BM: Scheduled backups');

BeforeSuite(async ({
  I, backupAPI, locationsAPI, settingsAPI, psMySql,
}) => {
  await settingsAPI.changeSettings({ backup: true });
  await backupAPI.clearAllArtifacts();
  await locationsAPI.clearAllLocations(true);
  locationId = await locationsAPI.createStorageLocation(location);
  const mysqlComposeConnection = {
    host: '127.0.0.1',
    port: '3306',
    username: 'root',
    password: "PMM_userk12456",
  };

  psMySql.connectToPS(mysqlComposeConnection);

  await I.say(await I.verifyCommand(`pmm-admin add mysql --username=${mysqlComposeConnection.username} --password=${mysqlComposeConnection.password} --query-source=perfschema ${mysqlServiceName}`));
});

Before(async ({
  I, settingsAPI, scheduledPage, inventoryAPI, scheduledAPI,
}) => {
  const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MYSQL_SERVICE', mysqlServiceName);

  serviceId = service_id;

  await I.Authorize();
  await settingsAPI.changeSettings({ backup: true });
  await scheduledAPI.clearAllSchedules();
  await scheduledPage.openScheduledBackupsPage();
});

AfterSuite(async ({ psMySql }) => {
  await psMySql.disconnectFromPS();
});

Scenario(
  'PMM-T923 - Verify user is able to schedule a backup for MySQL @nightly @bm-mysql',
  async ({
    I, backupInventoryPage, scheduledAPI, backupAPI, scheduledPage,
  }) => {
    const schedule = {
      name: 'schedule for backup',
      retention: 1,
    };

    scheduledPage.openScheduleBackupModal();
    scheduledPage.selectDropdownOption(scheduledPage.fields.serviceNameDropdown, mysqlServiceName);
    I.fillField(scheduledPage.fields.backupName, schedule.name);
    scheduledPage.selectDropdownOption(scheduledPage.fields.locationDropdown, location.name);
    scheduledPage.selectDropdownOption(scheduledPage.fields.everyDropdown, 'Minute');
    scheduledPage.clearRetentionField();
    I.fillField(scheduledPage.fields.retention, schedule.retention);

    // Verify mention about UTC time in create schedule modal
    I.seeTextEquals(
      scheduledPage.messages.scheduleInModalLabel,
      locate(scheduledPage.elements.scheduleBlockInModal).find('h6'),
    );
    I.click(scheduledPage.buttons.createSchedule);
    I.waitForVisible(scheduledPage.elements.scheduleName(schedule.name), 20);
    I.seeTextEquals('1 backup', scheduledPage.elements.retentionByName(schedule.name));

    // Verify local timestamp is shown in Last Backup column
    await scheduledAPI.waitForFirstExecution(schedule.name);
    scheduledPage.openScheduledBackupsPage();
    I.seeTextEquals(moment().format('YYYY-MM-DDHH:mm:00'), scheduledPage.elements.lastBackupByName(schedule.name));

    await backupAPI.waitForBackupFinish(null, schedule.name, 300);
    const { scheduled_backup_id } = await scheduledAPI.getScheduleIdByName(schedule.name);

    await scheduledAPI.disableScheduledBackup(scheduled_backup_id);

    backupInventoryPage.verifyBackupSucceeded(schedule.name);
  },
);
