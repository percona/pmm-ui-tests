const assert = require('assert');

Feature('PMM upgrade tests for external services');

const serviceName = 'pmm-ui-tests-redis-external-remote';

Scenario(
  'Adding Redis as external Service before Upgrade @pre-external-upgrade',
  async ({
    I, addInstanceAPI,
  }) => {
    await addInstanceAPI.addExternalService(serviceName);
    await I.verifyCommand(
      `pmm-admin add external --listen-port=42200 --group="redis" --custom-labels="testing=redis" --service-name=${serviceName}-2`,
    );
  },
);

Scenario(
  'Verify Redis as external Service Works After Upgrade @post-external-upgrade @post-client-upgrade',
  async ({
    I, grafanaAPI, remoteInstancesHelper,
  }) => {
    // Make sure Metrics are hitting before Upgrade
    const metricName = 'redis_uptime_in_seconds';
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    await grafanaAPI.checkMetricExist(metricName);
    await grafanaAPI.checkMetricExist(metricName, { type: 'node_name', value: serviceName });
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
