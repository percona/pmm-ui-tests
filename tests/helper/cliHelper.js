const faker = require('faker');
const assert = require('assert');

const { I, inventoryAPI } = inject();

/**
 * Percona Server MySQL DB interaction module.
 * Based on "codeceptjs-dbhelper" plugin.
 */
module.exports = {
  /**
   * Sets up agent with specific flags and verifies success of operation.
   *
   * @param dbName - name database agent is for.
   * @param dbVersion - version of database.
   * @param dbPort - port agent should listen to
   * @param containerName - name of container in which database is running
   * @param agentName - name of the agent that should be setup
   * @param agentFlags - flags used in 'pmm-admin inventory add agent' command
   * @param [authInfo = ''] - (optional, `` empty by default) credentials used in 'pmm-admin inventory add agent' command
   * @param [logLevel = ''] - (optional, `` empty by default) define log level for new agent
   */
  async setupAndVerifyAgent(dbName, dbVersion, dbPort, containerName, agentName, agentFlags, logLevel = '', authInfo = '') {
    let expectedLogLevel = 'warn';
    let flags = agentFlags;

    if (logLevel !== '') {
      flags = `${flags} --log-level=${logLevel}`;
      expectedLogLevel = logLevel;
    }

    const serviceName = `${dbName}_${dbVersion}_service_${faker.random.alphaNumeric(3)}`;

    const pmmAdminNodeId = (await I.verifyCommand(`docker exec ${containerName} pmm-admin status | grep 'Node ID' | awk -F " " '{print $4}' `)).trim();
    const pmmAdminAgentId = (await I.verifyCommand(`docker exec ${containerName} pmm-admin status | grep 'Agent ID' | awk -F " " '{print $4}' `)).trim();

    await I.verifyCommand(`docker exec ${containerName} pmm-admin inventory add service ${dbName} ${serviceName} ${pmmAdminNodeId} localhost ${dbPort}`);
    const serviceId = (await I.verifyCommand(`docker exec ${containerName} pmm-admin list | grep ${serviceName} | awk -F  " " '{print $4}' `)).trim();

    await I.verifyCommand(`docker exec ${containerName} pmm-admin inventory add agent ${agentName} ${flags} ${pmmAdminAgentId} ${serviceId} ${authInfo}`);
    await inventoryAPI.waitForRunningState(serviceId);
    await I.verifyCommand(`docker exec ${containerName} pmm-admin list | grep ${serviceId} | grep Running`);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(serviceId);

    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.hasOwnProperty('log_level'), `Was expecting ${agentName} ${serviceName}(${serviceId}) to have "log_level" property`);
    assert.strictEqual(agentInfo.log_level, expectedLogLevel, `Was expecting ${agentName} for ${serviceName}(${serviceId}) to have "${expectedLogLevel}" as a log level`);

    return serviceName;
  },
};
