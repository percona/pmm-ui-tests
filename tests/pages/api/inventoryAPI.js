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
    console.log(responseService.service_id);
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

  async apiGetNodeInfoByServiceName(serviceType, serviceName, excludeSubstring) {
    const service = await this.apiGetServices(serviceType);

    const data = Object.values(service.data)
      .flat(Infinity)
      .filter(({ service_name }) => service_name.includes(serviceName));

    if (excludeSubstring) {
      return data.find(({ service_name }) => !service_name.includes(excludeSubstring));
    }

    return data ? data[0] : null;
  },

  async apiGetNodeInfoForAllNodesByServiceName(serviceType, serviceName) {
    const service = await this.apiGetServices(serviceType);

    const data = Object.values(service.data)
      .flat(Infinity)
      .filter(({ service_name }) => service_name.startsWith(serviceName));

    return data;
  },

  async apiGetPMMAgentInfoByServiceId(serviceId) {
    const agents = await this.apiGetAgents(serviceId);
    const data = Object.values(agents.data)
      .flat(Infinity)
      .filter(({ service_id }) => service_id === serviceId);

    return data[0];
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
   * Searches node by related service name and deletes if found using v1 API
   *
   * @param   serviceType   {@link remoteInstancesHelper.serviceTypes.*.serviceType}
   * @param   serviceName   name of the service to search
   * @param   force         {@link Boolean} flag
   * @returns {Promise<void>}
   */
  async deleteNodeByServiceName(serviceType, serviceName, force = true) {
    const node = await this.apiGetNodeInfoByServiceName(serviceType, serviceName);

    if (node) {
      await this.deleteNode(node.node_id, force);
    } else {
      await I.say(`Node for "${serviceName}" service is not found!`);
    }
  },

  async deleteNodeByName(nodeName, force = true) {
    const node = await this.getNodeByName(nodeName);

    if (node) {
      await this.deleteNode(node.node_id, force);
    } else {
      await I.say(`Node with name "${nodeName}" is not found!`);
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

  async getNodeByName(nodeName) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/inventory/Nodes/List', {}, headers);

    const node = Object.values(resp.data)
      .flat(Infinity)
      .find(({ node_name }) => node_name === nodeName);

    return node || null;
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
