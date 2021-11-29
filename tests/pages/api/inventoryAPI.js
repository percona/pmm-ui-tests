const assert = require('assert');

const { I, remoteInstancesHelper } = inject();

module.exports = {
  async verifyServiceExistsAndHasRunningStatus(service, serviceName) {
    let responseService;

    // 30 sec ping for getting created service name
    for (let i = 0; i < 30; i++) {
      const services = await this.apiGetServices(service.serviceType);

      responseService = services.data[service.service].find((obj) => obj.service_name === serviceName);
      if (responseService !== undefined) break;

      await new Promise((r) => setTimeout(r, 1000));
    }

    assert.ok(responseService !== undefined, `Service ${serviceName} was not found`);
    const agents = await this.waitForRunningState(responseService.service_id);

    assert.ok(agents, `One or more agents are not running for ${service.service}`);
  },

  async waitForRunningState(serviceId) {
    // 30 sec ping for getting Running status for Agents
    for (let i = 0; i < 30; i++) {
      const agents = await this.apiGetAgents(serviceId);
      const areRunning = Object.values(agents.data)
        .flat(Infinity)
        .every(({ status }) => status === 'RUNNING');

      if (areRunning) {
        return agents;
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    return false;
  },

  async apiGetNodeInfoByServiceName(serviceType, serviceName) {
    const service = await this.apiGetServices(serviceType);

    const data = Object.values(service.data)
      .flat(Infinity)
      .filter(({ service_name }) => service_name.includes(serviceName));

    return data[0];
  },

  async apiGetPMMAgentInfoByServiceId(serviceId) {
    const agents = await this.apiGetAgents(serviceId);
    const data = Object.values(agents.data)
      .flat(Infinity)
      .filter(({ service_id }) => service_id === serviceId);

    return data[0];
  },

  async apiGetAllAgents() {
    const body = {};
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    return I.sendPostRequest('v1/inventory/Agents/List', body, headers);
  },

  async apiGetAgents(serviceId) {
    const body = {
      service_id: serviceId,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    return I.sendPostRequest('v1/inventory/Agents/List', body, headers);
  },

  async apiGetAgentsViaNodeId(nodeId) {
    const body = {
      node_id: nodeId,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    return I.sendPostRequest('v1/inventory/Agents/List', body, headers);
  },

  async apiGetServices(serviceType) {
    const body = serviceType ? { service_type: serviceType } : {};
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    return await I.sendPostRequest('v1/inventory/Services/List', body, headers);
  },

  async verifyServiceIdExists(serviceId) {
    const services = await this.apiGetServices(remoteInstancesHelper.serviceTypes.postgresql.serviceType);

    const present = Object.values(services.data)
      .flat(Infinity)
      .find(({ service_id }) => service_id === serviceId);

    assert.ok(present, `Service with ID ${serviceId} does not exist.`);
  },

  async getServiceById(serviceId) {
    const resp = await this.apiGetServices();

    return Object.values(resp.data)
      .flat(Infinity)
      .filter(({ service_id }) => service_id === serviceId);
  },

  /**
   * Returns Service Obj by specified Name of the service.
   *
   * @param     serviceName   to search the service
   * @returns   {Promise<{serviceObject}>} if service found; empty object otherwise.
   */
  async getServiceByName(serviceName) {
    const resp = await this.apiGetServices();
    const result = Object.values(resp.data)
      .flat(Infinity)
      .find(({ service_name }) => service_name === serviceName);

    return result && Object.prototype.hasOwnProperty.call(result, 'service_id') ? result : {};
  },

  /**
   * Fluent wait for the specified Service to appear using the API.
   * Fails test is timeout exceeded.
   *
   * @param     serviceName       a name to search
   * @param     timeOutInSeconds  time to wait for a service to appear
   * @returns   {Promise<{serviceObject}>}
   */
  async waitForServiceExist(serviceName, timeOutInSeconds) {
    const start = new Date().getTime();
    const timout = timeOutInSeconds * 1000;
    const interval = 1;

    /* eslint no-constant-condition: ["error", { "checkLoops": false }] */
    while (true) {
      // Main condition check: service obj returned
      const obj = await this.getServiceByName(serviceName);

      if (obj && Object.prototype.hasOwnProperty.call(obj, 'service_id')) {
        return obj;
      }

      // Check the timeout after evaluating main condition
      // to ensure conditions with a zero timeout can succeed.

      if (new Date().getTime() - start >= timout) {
        assert.fail(`Service "${serviceName}" did not appear: 
        tried to check for ${timeOutInSeconds} second(s) with ${interval} second(s) with interval`);
      }

      I.wait(interval);
    }
  },

  async deleteNode(nodeID, force) {
    const body = {
      force,
      node_id: nodeID,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/inventory/Nodes/Remove', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to delete Node. Response message is "${resp.data.message}"`,
    );
  },

  async deleteService(serviceId, force = true) {
    const body = {
      force,
      service_id: serviceId,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/inventory/Services/Remove', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to delete Service. Response message is "${resp.data.message}"`,
    );
  },

  async getNodeName(nodeID) {
    const body = {
      node_id: nodeID,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/inventory/Nodes/Get', body, headers);

    const values = Object.values(resp.data)
      .flat(Infinity)
      .find(({ node_id }) => node_id === nodeID);

    return values.node_name;
  },
};
