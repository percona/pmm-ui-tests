const assert = require('assert');
const { NODE_TYPE } = require('../helper/constants');

Feature('PMM upgrade tests for external services');

const serviceName = 'pmm-ui-tests-redis-external-remote';

Scenario(
  'Adding Redis as external Service before Upgrade @pre-external-upgrade',
  async ({
    I, addInstanceAPI,
  }) => {
    await addInstanceAPI.addExternalService(serviceName);
    await I.verifyCommand(
      `docker exec external_pmm pmm-admin add external --listen-port=42200 --group="redis" --custom-labels="testing=redis" --service-name=${serviceName}-2`,
    );
  },
);

Scenario(
  'Verify user can create Remote Instances before upgrade @pre-external-upgrade',
  async ({ I, addInstanceAPI, remoteInstancesHelper }) => {
    // Adding instances for monitoring

    const aurora_details = {
      add_node: {
        node_name: 'pmm-qa-aurora2-mysql-instance-1',
        node_type: NODE_TYPE.REMOTE,
      },
      aws_access_key: remoteInstancesHelper.remote_instance.aws.aurora.aws_access_key,
      aws_secret_key: remoteInstancesHelper.remote_instance.aws.aurora.aws_secret_key,
      address: remoteInstancesHelper.remote_instance.aws.aurora.aurora2.address,
      service_name: 'pmm-qa-aurora2-mysql-instance-1',
      port: remoteInstancesHelper.remote_instance.aws.aurora.port,
      username: remoteInstancesHelper.remote_instance.aws.aurora.username,
      password: remoteInstancesHelper.remote_instance.aws.aurora.aurora2.password,
      instance_id: 'pmm-qa-aurora2-mysql-instance-1',
      cluster: 'rdsaurora',
    };

    console.log(await I.verifyCommand('docker ps -a'));

    for (const type of Object.values(remoteInstancesHelper.instanceTypes)) {
      if (type) {
        if (type === 'RDSAurora') {
          await addInstanceAPI.apiAddInstance(
            type,
            remoteInstancesHelper.upgradeServiceNames[type.toLowerCase()],
            aurora_details,
          );
        } else {
          await addInstanceAPI.apiAddInstance(
            type,
            remoteInstancesHelper.upgradeServiceNames[type.toLowerCase()],
          );
        }
      }
    }
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

Scenario(
  'Verify Agents are RUNNING after Upgrade (API) [critical] @post-external-upgrade @post-client-upgrade',
  async ({ inventoryAPI, remoteInstancesHelper }) => {
    for (const service of Object.values(remoteInstancesHelper.serviceTypes)) {
      if (service) {
        await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
          service,
          remoteInstancesHelper.upgradeServiceNames[service.service],
        );
      }
    }
  },
);

Scenario(
  'Verify Agents are RUNNING after Upgrade (UI) [critical] @post-external-upgrade @post-client-upgrade',
  async ({ I, pmmInventoryPage, remoteInstancesHelper }) => {
    for (const service of Object.values(remoteInstancesHelper.upgradeServiceNames)) {
      if (service) {
        I.amOnPage(pmmInventoryPage.url);
        await I.scrollPageToBottom();
        await pmmInventoryPage.verifyAgentHasStatusRunning(service);
      }
    }
  },
);

Scenario(
  'Verify Agents are Running and Metrics are being collected Post Upgrade (UI) [critical] @post-external-upgrade @post-client-upgrade',
  async ({ grafanaAPI, remoteInstancesHelper }) => {
    const metrics = Object.keys(remoteInstancesHelper.upgradeServiceMetricNames);

    for (const service of Object.values(remoteInstancesHelper.upgradeServiceNames)) {
      if (service) {
        if (metrics.includes(service)) {
          const metricName = remoteInstancesHelper.upgradeServiceMetricNames[service];

          await grafanaAPI.checkMetricExist(metricName, { type: 'node_name', value: service });
        }
      }
    }
  },
);

Scenario(
  'Verify QAN has specific filters for Remote Instances after Upgrade (UI) @post-external-upgrade @post-client-upgrade',
  async ({
    I, queryAnalyticsPage, remoteInstancesHelper,
  }) => {
    I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-5m' }));
    queryAnalyticsPage.waitForLoaded();

    // Checking that Cluster filters are still in QAN after Upgrade
    for (const name of Object.keys(remoteInstancesHelper.upgradeServiceNames)) {
      if (remoteInstancesHelper.qanFilters.includes(name)) {
        queryAnalyticsPage.waitForLoaded();
        I.waitForVisible(queryAnalyticsPage.filters.fields.filterByName(name), 30);
        I.seeElement(queryAnalyticsPage.filters.fields.filterByName(name));
      }
    }
  },
);
