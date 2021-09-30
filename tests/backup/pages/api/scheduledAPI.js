const { I } = inject();
const assert = require('assert');
const { storageLocationConnection } = require('../testData');

module.exports = {
  async createScheduledBackup(scheduleObj) {
    const {
      service_id,
      location_id,
      name,
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

    for (const { location_id } of schedules) {
      await this.removeScheduledBackup(location_id, true);
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
};
