import { pmmFrameworkServices } from '../utils/pmmFrameworkServices';

Feature('This is a test');

const data = [pmmFrameworkServices.pgsql];

Data(data).Scenario('This is a test', async ({ I, api, current }) => {
  console.log(current);
  const service = await api.inventory.getServiceByPartialName(current.containerName);
  const pmmAgentId = service.agents.find((agent) => agent.agent_type === 'pmm-agent').agent_id;

  switch (current.serviceType) {
    case 'postgresql':
      // await I.verifyCommand(`pmm-admin add postgresql --username=pmm --password=pmm --node-id=${service.node_id} --pmm-agent-id=${pmmAgentId} --port=${service.port} --host=${service.address} --agent-password=uitests --custom-labels="testing=upgrade" upgrade-${current.serviceType}`);
      console.log(`pmm-admin add postgresql --username=pmm --password=pmm --node-id=${service.node_id} --pmm-agent-id=${pmmAgentId} --port=${service.port} --host=${service.address} --agent-password=uitests --custom-labels="testing=upgrade" upgrade-${current.serviceType}`)
      break;
    default:
  }
});