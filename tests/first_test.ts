import { pmmFrameworkServices } from '../utils/pmmFrameworkServices';

Feature('This is a test');

const data = [pmmFrameworkServices.psmdb, pmmFrameworkServices.pgsql, pmmFrameworkServices.ps];

Data(data).Scenario('Adding custom agent Password, Custom Label before upgrade At service Level @pre-custom-password-upgrade', async ({ I, api, current }) => {
  const service = await api.inventory.getServiceByPartialName(current.serviceName);
  const pmmAgentId = service.agents.find((agent) => agent.agent_type === 'pmm-agent').agent_id;

  switch (current.serviceType) {
    case 'postgresql':
      await I.verifyCommand(`pmm-admin add postgresql --username=pmm --password=pmm --node-id=${service.node_id} --pmm-agent-id=${pmmAgentId} --port=${service.port} --host=${service.address} --agent-password=uitests --custom-labels="testing=upgrade" upgrade-${current.serviceType}`);
      break;
    case 'mysql':
      await I.verifyCommand(`pmm-admin add mysql --node-id=${service.node_id} --pmm-agent-id=${pmmAgentId} --port=${service.port} --password=${current.password} --host=${service.address} --query-source=perfschema --agent-password=uitests --custom-labels="testing=upgrade" upgrade-${current.serviceType}`);
      break;
    case 'mongodb':
      await I.verifyCommand(`pmm-admin add mongodb --username=${current.username} --password="${current.password}" --port=${current.port} --host=${service.address} --agent-password=uitests --custom-labels="testing=upgrade" upgrade-${current.serviceType}`);
      break;
    default:
  }
});

Data(data).Scenario('Verify if Agents added with custom password and custom label work as expected Post Upgrade @post-client-upgrade @post-custom-password-upgrade', async ({ I, api, current }) => {
  const service = await api.inventory.getServiceByPartialName(`upgrade-${current.serviceType}`);

  if (!service.custom_labels.testing) {
    throw new Error('Custom label was not present');
  } else if (service.custom_labels.testing !== 'upgrade') {
    throw new Error(`Custom label should be upgrade but was: ${service.custom_labels.testing}`);
  }

  await api.grafana.checkMetricExist(current.standardMetric, { type: 'service_name', value: service.service_name });
});
