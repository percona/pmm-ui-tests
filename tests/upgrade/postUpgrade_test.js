const assert = require('assert');
const { SERVICE_TYPE } = require('../helper/constants');

const { locationsAPI } = inject();

Feature('PMM server post Upgrade Tests').retry(1);

const mongoServiceName = 'mongo-backup-upgrade';

const location = {
  name: 'upgrade-location',
  description: 'upgrade-location description',
  ...locationsAPI.storageLocationConnection,
};

Scenario(
  'Verify Redis as external Service Works After Upgrade @post-external-upgrade @post-client-upgrade',
  async ({
    I, grafanaAPI, remoteInstancesHelper,
  }) => {
    // Make sure Metrics are hitting before Upgrade
    const metricName = 'redis_uptime_in_seconds';
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    await grafanaAPI.checkMetricExist(metricName);
    await grafanaAPI.checkMetricExist(metricName, { type: 'node_name', value: 'redis_external_remote' });
    // removing check for upgrade verification
    // await grafanaAPI.checkMetricExist(metricName, { type: 'service_name', value: 'redis_external_2' });

    const response = await I.sendGetRequest('prometheus/api/v1/targets', headers);
    const targets = response.data.data.activeTargets.find(
      (o) => o.labels.external_group === 'redis-remote',
    );

    const expectedScrapeUrl = `${remoteInstancesHelper.remote_instance.external.redis.schema}://${remoteInstancesHelper.remote_instance.external.redis.host
    }:${remoteInstancesHelper.remote_instance.external.redis.port}${remoteInstancesHelper.remote_instance.external.redis.metricsPath}`;

    assert.ok(
      targets.scrapeUrl === expectedScrapeUrl,
      `Active Target for external service Post Upgrade has wrong Address value, value found is ${targets.scrapeUrl} and value expected was ${expectedScrapeUrl}`,
    );
    assert.ok(targets.health === 'up', `Active Target for external service Post Upgrade health value is not up! value found ${targets.health}`);
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
