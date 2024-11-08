const { I, mysqlAgentCli } = inject();

class PgsqlAgentCli {
  async verifyAgentLogLevel(exporterType, dbDetails, logLevel = 'warn') {
    const logLvlFlag = logLevel ? `--log-level=${logLevel}` : '';
    const addAgentResponse = await I.verifyCommand(`docker exec ${dbDetails.container_name} \
                                                      pmm-admin inventory add agent ${exporterType} \
                                                      --password=${dbDetails.password} \
                                                      ${exporterType === 'mysqld-exporter' ? '--push-metrics' : ''} \
                                                      ${logLvlFlag} ${dbDetails.pmm_agent_id} ${dbDetails.service_id} \
                                                      ${dbDetails.username}`);
    const agent_id = addAgentResponse.split('\n').find((row) => row.includes('Agent ID')).split(':')[1].trim();

    const actualLogLevel = await mysqlAgentCli.getLogLevel(agent_id, exporterType);

    I.say(`Actual log level is: ${actualLogLevel}`);
    I.assertEqual(
      actualLogLevel,
      mysqlAgentCli.getLogLevelResponse(logLevel),
      `Expecting Exporter for service ${dbDetails.service_name} added via command to have log level: ${mysqlAgentCli.getLogLevelResponse(logLevel)} set, actual log level was: ${actualLogLevel}`,
    );

    await I.verifyCommand(`docker exec ${dbDetails.container_name} pmm-admin inventory remove agent ${agent_id}`);
  }
}

module.exports = new PgsqlAgentCli();
module.exports.AgentCli = PgsqlAgentCli;
