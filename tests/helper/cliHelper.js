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
   * @param [authInfo = ''] - (optional, `` empty by default) username and password used in 'pmm-admin inventory add agent' command
   * @param [loglevel = ''] - (optional, `` empty by default) define log level for new agent
   */
  async setupAndVerifyAgent(dbName, dbVersion, dbPort, containerName, agentName, agentFlags, loglevel = '', authInfo = '' ) {
    let expectedLogLevel = 'warn';
    if (loglevel !== ''){
      agentFlags = `${agentFlags} --log-level=${loglevel}`;
      expectedLogLevel = loglevel;
    };
    const serviceName = `${dbName}_${dbVersion}_service${faker.random.alphaNumeric(3)}`;

    const pmmAdminNodeId = await I.verifyCommand(`docker exec ${containerName} pmm-admin status | grep 'Node ID' | awk -F " " '{print $4}' | tr -d '\\n'`);
    const pmmAdminAgentId = await I.verifyCommand(`docker exec ${containerName} pmm-admin status | grep 'Agent ID' | awk -F " " '{print $4}' | tr -d '\\n'`);

    await I.verifyCommand(`docker exec ${containerName} pmm-admin inventory add service ${dbName} ${serviceName} ${pmmAdminNodeId} localhost ${dbPort}`);
    const serviceId = await I.verifyCommand(`docker exec ${containerName} pmm-admin list | grep ${serviceName} | awk -F  " " '{print $4}' | tr -d '\\n'`);
    
    await I.verifyCommand(`docker exec ${containerName} pmm-admin inventory add agent ${agentName} ${agentFlags} ${pmmAdminAgentId} ${serviceId} ${authInfo}`);
    await inventoryAPI.waitForRunningState(serviceId);
    await I.verifyCommand(`docker exec ${containerName} pmm-admin list | grep ${serviceId} | grep Running`);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(serviceId);

    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.hasOwnProperty('log_level'), `Was expecting qan-mongodb-profiler-agent ${serviceName}(${serviceId}) to have "log_level" property`);
    assert.strictEqual(agentInfo.log_level, expectedLogLevel, `Was expecting qan-mongodb-profiler-agent for ${serviceName}(${serviceId}) to have "${expectedLogLevel}" as a log level`);

    return serviceName;
  },
};
