const { I, inventoryAPI } = inject();

class MysqlAgentCli {
  async verifyMySqlAgentLogLevel(exporterType, dbDetails, logLevel = 'warn') {
    const logLvlFlag = logLevel ? `--log-level=${logLevel}` : '';
    const agent_id = (await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory add agent ${exporterType} --password=${dbDetails.password} --push-metrics ${logLvlFlag} ${dbDetails.pmm_agent_id} ${dbDetails.service_id} ${dbDetails.username} | grep "Agent ID" | grep -v "PMM-Agent ID" | awk -F " " '{print $4}'`)).trim();
    const actualLogLevel = getLogLevel(agent_id, exporterType);

    I.say(`Actual log level is: ${actualLogLevel}`);
    I.assertEqual(actualLogLevel, getLogLevelResponse(logLevel), `Was expecting Mysql Exporter for service ${dbDetails.service_name} added again via inventory command and log level to have ${getLogLevelResponse(logLevel)} set, actual log level was: ${actualLogLevel}`);

    await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory remove agent ${agent_id}`);
  }
}

async function getLogLevel(agentId, exporterType) {
  const output = await inventoryAPI.apiGetAgentDetailsViaAgentId(agentId);

  await I.say(JSON.stringify(output.data, null, 2));

  return output.data[exporterType.replaceAll('-', '_')].log_level;
}

function getLogLevelResponse(logLevelFlag) {
  switch (logLevelFlag) {
    case 'warn':
      return 'LOG_LEVEL_WARN';
    default:
      throw new Error(`Log Level: ${logLevelFlag} is not supported`);
  }
}

module.exports = new MysqlAgentCli();
module.exports.AgentCli = MysqlAgentCli;
