const assert = require('assert');

const { I, remoteInstancesHelper, grafanaAPI } = inject();

module.exports = {
  // TODO: simplify argument secrive to just {String type}, apply fluent wait from custom steps
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

  async apiGetNodeInfoByServiceName(serviceType, serviceName, excludeSubstring) {
    const service = await this.apiGetServices(serviceType);

    const data = Object.values(service.data)
      .flat(Infinity)
      .filter(({ service_name }) => service_name.includes(serviceName));

    if (data.length === 0) await I.say(`Service "${serviceName}" of "${serviceType}" type is not found!`);

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

  async apiGetAgentDetailsViaAgentId(agentId) {
    const body = {
      agent_id: agentId,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    return I.sendPostRequest('v1/inventory/Agents/Get', body, headers);
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

  async verifyAgentLogLevel(agentType, dbDetails, logLevel) {
    let agent_id;
    let output;
    let log_level;
    const logLvlFlag = logLevel ? `--log-level=${logLevel}` : '';

    switch (agentType) {
      case 'mongodb':
        agent_id = (await I.verifyCommand(`pmm-admin inventory add agent mongodb-exporter --password=${dbDetails.password} --push-metrics ${logLvlFlag} ${dbDetails.pmm_agent_id} ${dbDetails.service_id} ${dbDetails.username} | grep "Agent ID" | grep -v "PMM-Agent ID" | awk -F " " '{print $4}'`)).trim();
        output = await this.apiGetAgentDetailsViaAgentId(agent_id);
        log_level = output.data.mongodb_exporter.log_level;
        await grafanaAPI.waitForMetric('mongodb_up', [{ type: 'agent_id', value: agent_id }], 90);
        I.assertEqual(log_level, logLevel || 'warn', `Was expecting Mongo Exporter for service ${dbDetails.service_name} added again via inventory command and log level to have ${logLevel || 'warn'} set`);
        break;
      case 'node':
        agent_id = (await I.verifyCommand(`pmm-admin inventory add agent node-exporter --push-metrics ${logLvlFlag} ${dbDetails.pmm_agent_id} | grep "Agent ID" | grep -v "PMM-Agent ID" | awk -F " " '{print $4}'`)).trim();
        output = await this.apiGetAgentDetailsViaAgentId(agent_id);
        log_level = output.data.node_exporter.log_level;
        await grafanaAPI.waitForMetric('node_memory_MemTotal_bytes', [{ type: 'agent_id', value: agent_id }], 90);
        assert.ok(log_level === logLevel || 'warn', `Was expecting Node Exporter for service ${dbDetails.service_name} added again via inventory command and log level to have ${logLevel || 'warn'} set`);
        break;
      case 'mongodb_profiler':
        agent_id = (await I.verifyCommand(`pmm-admin inventory add agent qan-mongodb-profiler-agent --password=${dbDetails.password} ${logLvlFlag} ${dbDetails.pmm_agent_id} ${dbDetails.service_id} ${dbDetails.username} | grep "Agent ID" | grep -v "PMM-Agent ID" | awk -F " " '{print $4}'`)).trim();
        output = await this.apiGetAgentDetailsViaAgentId(agent_id);
        log_level = output.data.qan_mongodb_profiler_agent.log_level;

        // Wait for Status to change to running
        I.wait(10);
        await I.verifyCommand(`pmm-admin list | grep mongodb_profiler_agent | grep ${agent_id} | grep ${dbDetails.service_id} | grep "Running"`);
        assert.ok(log_level === logLevel || 'warn', `Was expecting MongoDB QAN Profile for service ${dbDetails.service_name} added again via inventory command and log level to have ${logLevel || 'warn'} set`);
        break;
      case 'postgresql':
        agent_id = (await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory add agent postgres-exporter --password=${dbDetails.password} --push-metrics ${logLvlFlag} ${dbDetails.pmm_agent_id} ${dbDetails.service_id} ${dbDetails.username} | grep "Agent ID" | grep -v "PMM-Agent ID" | awk -F " " '{print $4}'`)).trim();
        output = await this.apiGetAgentDetailsViaAgentId(agent_id);
        log_level = output.data.postgres_exporter.log_level;

        await grafanaAPI.waitForMetric('pg_up', [{ type: 'agent_id', value: agent_id }], 90);
        assert.ok(log_level === logLevel || 'warn', `Was expecting Postgresql Exporter for service ${dbDetails.service_name} added again via inventory command and log level to have ${logLevel || 'warn'} set`);
        await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory remove agent ${agent_id}`);
        break;
      case 'pgstatmonitor':
        agent_id = (await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory add agent qan-postgresql-pgstatmonitor-agent --password=${dbDetails.password} ${logLvlFlag} ${dbDetails.pmm_agent_id} ${dbDetails.service_id} ${dbDetails.username} | grep "Agent ID" | grep -v "PMM-Agent ID" | awk -F " " '{print $4}'`)).trim();
        output = await this.apiGetAgentDetailsViaAgentId(agent_id);
        log_level = output.data.qan_postgresql_pgstatmonitor_agent.log_level;

        // Wait for Status to change to running
        I.wait(10);
        await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin list | grep postgresql_pgstatmonitor_agent | grep ${agent_id} | grep ${dbDetails.service_id} | grep "Running"`);
        assert.ok(log_level === logLevel || 'warn', `Was expecting PGSTAT_MONITOR QAN for service ${dbDetails.service_name} added again via inventory command and log level to have ${logLevel || 'warn'} set`);
        await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory remove agent ${agent_id}`);
        break;
      case 'pgstatements':
        agent_id = (await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory add agent qan-postgresql-pgstatements-agent --password=${dbDetails.password} ${logLvlFlag} ${dbDetails.pmm_agent_id} ${dbDetails.service_id} ${dbDetails.username} | grep "Agent ID" | grep -v "PMM-Agent ID" | awk -F " " '{print $4}'`)).trim();
        output = await this.apiGetAgentDetailsViaAgentId(agent_id);
        log_level = output.data.qan_postgresql_pgstatements_agent.log_level;

        // Wait for Status to change to running
        I.wait(10);
        await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin list | grep postgresql_pgstatements_agent | grep ${agent_id} | grep ${dbDetails.service_id} | grep "Running"`);
        assert.ok(log_level === logLevel || 'warn', `Was expecting PGSTATSTATEMENT QAN for service ${dbDetails.service_name} added again via inventory command and log level to have ${logLevel || 'warn'} set`);
        await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory remove agent ${agent_id}`);
        break;
      case 'mysql':
        agent_id = (await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory add agent mysqld-exporter --password=${dbDetails.password} --push-metrics ${logLvlFlag} ${dbDetails.pmm_agent_id} ${dbDetails.service_id} ${dbDetails.username} | grep "Agent ID" | grep -v "PMM-Agent ID" | awk -F " " '{print $4}'`)).trim();
        output = await this.apiGetAgentDetailsViaAgentId(agent_id);
        log_level = output.data.mysqld_exporter.log_level;

        await grafanaAPI.waitForMetric('mysql_up', [{ type: 'agent_id', value: agent_id }], 90);
        assert.ok(log_level === logLevel || 'warn', `Was expecting Mysql Exporter for service ${dbDetails.service_name} added again via inventory command and log level to have ${logLevel || 'warn'} set`);
        await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory remove agent ${agent_id}`);
        break;
      case 'qan-slowlog':
        agent_id = (await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory add agent qan-mysql-slowlog-agent --password=${dbDetails.password} ${logLvlFlag} ${dbDetails.pmm_agent_id} ${dbDetails.service_id} ${dbDetails.username} | grep "Agent ID" | grep -v "PMM-Agent ID" | awk -F " " '{print $4}'`)).trim();
        output = await this.apiGetAgentDetailsViaAgentId(agent_id);
        log_level = output.data.qan_mysql_slowlog_agent.log_level;

        // Wait for Status to change to running
        I.wait(10);
        await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin list | grep mysql_slowlog_agent | grep ${agent_id} | grep ${dbDetails.service_id} | grep "Running"`);
        assert.ok(log_level === logLevel || 'warn', `Was expecting Slowlog QAN for service ${dbDetails.service_name} added again via inventory command and log level to have ${logLevel || 'warn'} set`);
        await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory remove agent ${agent_id}`);
        break;
      case 'qan-perfschema':
        agent_id = (await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory add agent qan-mysql-perfschema-agent --password=${dbDetails.password} ${logLvlFlag} ${dbDetails.pmm_agent_id} ${dbDetails.service_id} ${dbDetails.username} | grep "Agent ID" | grep -v "PMM-Agent ID" | awk -F " " '{print $4}'`)).trim();
        output = await this.apiGetAgentDetailsViaAgentId(agent_id);
        log_level = output.data.qan_mysql_perfschema_agent.log_level;

        // Wait for Status to change to running
        I.wait(10);
        await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin list | grep mysql_perfschema_agent | grep ${agent_id} | grep ${dbDetails.service_id} | grep "Running"`);
        assert.ok(log_level === logLevel || 'warn', `Was expecting PerfSchema QAN for service ${dbDetails.service_name} added again via inventory command and log level to have ${logLevel || 'warn'} set`);
        await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory remove agent ${agent_id}`);
        break;
      default:
    }
  },
};
