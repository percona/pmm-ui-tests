const { I, inventoryAPI } = inject();

class MysqlAgentCli {
  async verifyMySqlAgentLogLevel(exporterType, dbDetails, logLevel = 'warn') {
    const logLvlFlag = logLevel ? `--log-level=${logLevel}` : '';
    const addAgentResponse = await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory add agent ${exporterType} --password=${dbDetails.password} ${exporterType === 'mysqld-exporter' ? '--push-metrics': ''} ${logLvlFlag} ${dbDetails.pmm_agent_id} ${dbDetails.service_id} ${dbDetails.username}`);
    const agent_id = addAgentResponse.split('\n').find((row) => row.includes('Agent ID')).split(':')[1].trim();

    console.log(addAgentResponse);
    console.log(`Agent ID is: ${agent_id}`);

    I.wait(15);

    const actualLogLevel = await getLogLevel(agent_id, exporterType);

    I.say(`Actual log level is: ${actualLogLevel}`);
    I.assertEqual(actualLogLevel, getLogLevelResponse(logLevel), `Was expecting Mysql Exporter for service ${dbDetails.service_name} added again via inventory command and log level to have ${getLogLevelResponse(logLevel)} set, actual log level was: ${actualLogLevel}`);

    await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory remove agent ${agent_id}`);
  }
}

async function getLogLevel(agentId, exporterType) {
  const output = await inventoryAPI.apiGetAgentDetailsViaAgentId(agentId);

  await I.say(JSON.stringify(output.data, null, 2));

  console.log('Log Level output is: ');
  console.log(output.data);

  return output.data[exporterType.replaceAll('-', '_')].log_level;
}

function getLogLevelResponse(logLevelFlag) {
  switch (logLevelFlag) {
    case 'warn':
      return 'LOG_LEVEL_WARN';
    case 'debug':
      return 'LOG_LEVEL_DEBUG';
    case 'info':
      return 'LOG_LEVEL_INFO';
    case 'error':
      return 'LOG_LEVEL_ERROR';
    default:
      throw new Error(`Log Level: ${logLevelFlag} is not supported`);
  }
}

module.exports = new MysqlAgentCli();
module.exports.AgentCli = MysqlAgentCli;
