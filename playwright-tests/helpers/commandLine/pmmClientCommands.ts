import { exec } from "child_process";
import { executeCommand } from "../CommandLine";

const pmmClientCommands = {
  getNodeId: async () => {
    return (await executeCommand(`${getClientPrefix()}pmm-admin status | grep "Node ID"`)).stdout.replaceAll(' ', '').replace('NodeID:', '');
  },
  getProcessId: async (processName: string) => {
    return (await executeCommand(`${getClientPrefix()}pidof ${processName}`));
  },
  killProcess: async (procesId: string) => {
    await executeCommand(`${getClientPrefix()}kill -9 ${procesId}`);
  },
  moveFile: async (oldLocation: string, newLocation: string) => {
    await executeCommand(`${getClientPrefix()}mv ${oldLocation} ${newLocation}`)
  },
  setupAgent: async () => {
    const serverAddress = process.env.CI ? '127.0.0.1' : 'pmm-integration-server:443';
    await executeCommand(`${getClientPrefix()}pmm-agent setup --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml \
    --server-address=${serverAddress} --server-insecure-tls --server-username=admin --server-password=admin`)
  },
  forceSetupAgent: async (options?: { name?: string, address?: string, type?: string }) => {
    const serverAddress = process.env.CI ? '127.0.0.1' : 'pmm-integration-server:443';
    await executeCommand(`${getClientPrefix()}pmm-agent setup --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml \
    --server-address=${serverAddress} --server-insecure-tls --server-username=admin --server-password=admin --force ${options?.address || ''} ${options?.type || ''} ${options?.name || ''}`);
  },
  startAgent: async () => {
    exec(`${getClientPrefix()}pmm-agent --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml`)
  },
  addMongoDb: async (options: { address: string, name?: string, username?: string, password?: string, env?: string, port?: number }) => {
    await executeCommand(`${getClientPrefix()} pmm-admin add mongodb --cluster=${options.address} \
    --username=${options.username || 'mongoadmin'} --password=${options.password || 'GRgrO9301RuF'} --environment=${options.env || 'modb-prod'} \
    ${options.name || `mo-integration-${Date.now()}-0`} --debug ${options.address}:${options.port || '27017'}`);
  },
  addMySql: async (options: { address: string, querySource?: string, name?: string, username?: string, password?: string, env?: string, port?: number }) => {
    await executeCommand(`${getClientPrefix()} pmm-admin add mysql --query-source=${options.querySource || 'perfschema'} \
    --username=${options.username || 'root'} --password=${options.password || 'GRgrO9301RuF'} ${options.name || `ps_integration_${Date.now()}_0`} --host=${options.address} --port=${options.port || '3306'}`)
  },
  addPgSql: async (options: { address: string, querySource?: string, name?: string, username?: string, password?: string, env?: string, port?: number }) => {
    await executeCommand(`${getClientPrefix()}pmm-admin add postgresql --username=postgres --password=${options.password || 'oFukiBRg7GujAJXq3tmd'} \
    --environment=${options.env || 'pdpgsql-dev'} --cluster=pdpgsql-dev-cluster --query-source=${options.querySource || 'pgstatmonitor'} \
    --replication-set=pdpgsql-repl1 ${options.name || `pdpgsql-integration-${Date.now()}-0`}  ${options.address}:${options.port || '5432'}`);
  }
}

const getClientPrefix = () => {
  return process.env.CI ? 'sudo ' : 'sudo docker exec pmm-integration-client ';
}

export default pmmClientCommands;