const { I } = inject();
const assert = require('assert');

const backupModes = {
  snapshot: 'SNAPSHOT',
};

module.exports = {
  backupModes,
  async createScheduledBackup(scheduleObj) {
    const {
      service_id,
      location_id,
      name,
      mode = backupModes.snapshot,
      description = '',
      cron_expression,
      retry_interval,
      retries,
      retention,
      enabled,
    } = scheduleObj;

    const body = {
      service_id,
      location_id,
      cron_expression,
      name,
      mode,
      description,
      retry_interval,
      retries,
      enabled,
      retention,
    };

    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/management/backup/Backups/Schedule', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to create a scheduled backup with name "${name}" and params ${JSON.stringify(body, null, 2)}.
       Response message is "${resp.data.message}"`,
    );

    return resp.data.scheduled_backup_id;
  },

  async clearAllSchedules() {
    const schedules = await this.getScheduledList();

    if (!schedules) return;

    for (const { scheduled_backup_id } of schedules) {
      await this.removeScheduledBackup(scheduled_backup_id);
    }
  },

  async getScheduledList() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/backup/Backups/ListScheduled', {}, headers);

    return resp.data.scheduled_backups;
  },

  async removeScheduledBackup(scheduledId) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      scheduled_backup_id: scheduledId,
    };
    const resp = await I.sendPostRequest('v1/management/backup/Backups/RemoveScheduled', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to remove scheduled backup with ID "${scheduledId}". Response message is "${resp.data.message}"`,
    );
  },

  async getScheduleIdByName(scheduleName) {
    const scheduledBackups = await this.getScheduledList();

    return scheduledBackups.find(({ name }) => name === scheduleName);
  },

  async disableScheduledBackup(scheduledId) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      enabled: false,
      scheduled_backup_id: scheduledId,
    };
    const resp = await I.sendPostRequest('v1/management/backup/Backups/ChangeScheduled', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to disable scheduled backup with ID "${scheduledId}". Response message is "${resp.data.message}"`,
    );
  },
};
