const { I } = inject();
const assert = require('assert');
const FormData = require('form-data');
const faker = require('faker');

const rnd = faker.datatype.number();

module.exports = {
  customDashboardName: 'auto-test-dashboard',
  customFolderName: 'auto-test-folder',
  randomDashboardName: `auto-dashboard-${rnd}`,
  randomTag: `tag-${rnd}`,

  async createCustomDashboard(name, folderId = 0, tags = ['pmm-qa']) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      dashboard: {
        annotations: {
          list: [
            {
              builtIn: 1,
              datasource: '-- Grafana --',
              enable: true,
              hide: true,
              iconColor: 'rgba(0, 211, 255, 1)',
              name: 'Annotations & Alerts',
              type: 'dashboard',
            },
          ],
        },
        editable: true,
        panels: [
          {
            dashLength: 10,
            datasource: 'Metrics',
            fill: 1,
            gridPos: {
              h: 9,
              w: 12,
              x: 0,
              y: 0,
            },
            id: 2,
            targets: [
              {
                expr: 'alertmanager_alerts',
                refId: 'A',
              },
            ],
            title: 'Custom Panel',
            type: 'graph',
            xaxis: {
              mode: 'time',
              show: true,
            },
            yaxes: [
              {
                format: 'short',
                logBase: 1,
                show: true,
              },
              {
                format: 'short',
                logBase: 1,
                show: true,
              },
            ],
            yaxis: {
              align: false,
            },
          },
        ],
        schemaVersion: 26,
        style: 'dark',
        time: {
          from: 'now-6h',
          to: 'now',
        },
        title: name,
        tags,
        version: 0,
      },
      folderId,
    };
    const resp = await I.sendPostRequest('graph/api/dashboards/db/', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to create custom dashboard. Response message is ${resp.data.message}`,
    );

    return resp.data;
  },

  async deleteDashboard(uid) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendDeleteRequest(`graph/api/dashboards/uid/${uid}`, headers);

    assert.ok(
      resp.status === 200,
      `Failed to delete dashboard with uid '${uid}' . Response message is ${resp.data.message}`,
    );
  },

  async starDashboard(id) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest(`graph/api/user/stars/dashboard/${id}`, {}, headers);

    assert.ok(
      resp.status === 200,
      `Failed to star dashboard with id '${id}' . Response message is ${resp.data.message}`,
    );
  },

  async getDashboard(uid) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    return await I.sendGetRequest(`graph/api/dashboards/uid/${uid}`, headers);
  },

  async setHomeDashboard(id) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      homeDashboardId: id,
    };

    const resp = await I.sendPutRequest('graph/api/org/preferences', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to set custom Home dashboard '${id}'. Response message is ${resp.data.message}`,
    );
  },

  async createFolder(name) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      title: name,
    };
    const resp = await I.sendPostRequest('graph/api/folders', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to create "${name}" folder. Response message is ${resp.data.message}`,
    );

    return resp.data;
  },

  async lookupFolderByName(name) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendGetRequest('graph/api/folders', headers);

    const result = resp.data.filter((obj) => obj.title === name);

    return result.length > 0 ? result[0] : null;
  },

  async deleteFolder(uid) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendDeleteRequest(`graph/api/folders/${uid}`, headers);

    assert.ok(
      resp.status === 200,
      `Failed to delete folder with uid '${uid}' . Response message is ${resp.data.message}`,
    );
  },

  // Should be refactored
  async getMetric(metricName, refineBy) {
    const timeStamp = Date.now();
    const bodyFormData = new FormData();

    const body = {
      query: metricName,
      start: Math.floor((timeStamp - 15000) / 1000),
      end: Math.floor((timeStamp) / 1000),
      step: 1,
    };

    if (refineBy) {
      // ideally would need to refactor existing metric check to implement it this way
      if (Array.isArray(refineBy)) {
        let metricLabels = '';

        for (let i = 0; i < refineBy.length; i++) {
          const { type, value } = refineBy[i];
          const filter = `${type}="${value}", `;

          metricLabels = metricLabels.concat(filter);
        }

        body.query = `${metricName}{${metricLabels}}`;
      } else {
        body.query = `${metricName}{${refineBy.type}=~"(${refineBy.value})"}`;
      }
    }

    Object.keys(body).forEach((key) => bodyFormData.append(key, body[key]));
    const headers = {
      Authorization: `Basic ${await I.getAuth()}`,
      ...bodyFormData.getHeaders(),
    };

    return await I.sendPostRequest(
      'graph/api/datasources/proxy/1/api/v1/query_range',
      bodyFormData,
      headers,
    );
  },

  /**
   * Fluent wait for a specified metric to have non-empty body.
   * Fails test if timeout exceeded.
   *
   * @param     metricName          name of the metric to lookup
   * @param     queryBy             PrometheusQL expression, ex.: {node_name='MySQL Node'}
   * @param     timeOutInSeconds    time to wait for a service to appear
   * @returns   {Promise<Object>}   response Object, requires await when called
   */
  async waitForMetric(metricName, queryBy, timeOutInSeconds = 30) {
    const start = new Date().getTime();
    const timout = timeOutInSeconds * 1000;
    const interval = 1;

    await I.say(`Wait ${timeOutInSeconds} seconds for Metrics ${metricName} with filters as ${JSON.stringify(queryBy)} being collected`);

    /* eslint no-constant-condition: ["error", { "checkLoops": false }] */
    while (true) {
      // Main condition check: metric body is not empty
      const response = await this.getMetric(metricName, queryBy);

      if (response.data.data.result.length !== 0) {
        return response;
      }

      // Check the timeout after evaluating main condition
      // to ensure conditions with a zero timeout can succeed.
      if (new Date().getTime() - start >= timout) {
        assert.fail(`Metrics "${metricName}" is empty: 
        tried to check for ${timeOutInSeconds} second(s) with ${interval} second(s) with interval`);
      }

      I.wait(interval);
    }
  },

  async checkMetricExist(metricName, refineBy) {
    const response = await this.getMetric(metricName, refineBy);
    const result = JSON.stringify(response.data.data.result);

    I.assertTrue(response.data.data.result.length !== 0,
      `Metrics ${metricName} with filters as ${JSON.stringify(refineBy)} Should be available but got empty ${result}`);

    return response;
  },

  async checkMetricAbsent(metricName, refineBy) {
    const response = await this.getMetric(metricName, refineBy);
    const result = JSON.stringify(response.data.data.result);

    I.assertEqual(response.data.data.result.length, 0,
      `Metrics "${metricName}" with filters as ${JSON.stringify(refineBy)} should be empty but got available ${result}`);
  },
};
