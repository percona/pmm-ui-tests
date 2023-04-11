import shell from 'shelljs';
import { exec } from "child_process";

export const executeCommand = async (command: string, silent: boolean = true) => {
  const { stdout, stderr, code } = shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: true });

  if (code === 0) {
    if (!silent) {
      console.log(`The command ${command} was run successfully with result: ${stdout}`);
    }
  } else {
    throw new Error(`The command ${command} failed with error: ${stderr}`);
  }

  return { stdout, stderr };
};

const getClientPrefix = () => {
  return process.env.CI ? 'sudo ' : 'sudo docker exec pmm-integration-client ';
}

export const pmmServerCommands = {
  getNodeDetails: async (nodeId: string) => {
    const response = (await executeCommand(`sudo docker exec -u postgres pmm-integration-server psql -U pmm-managed  -c "SELECT * FROM nodes WHERE node_id = '${nodeId}'; " | grep '/node_id/'`))
      .stdout.replaceAll('|', '').replace(/ +(?= )/g, '').split(' ').filter((row) => row !== '');
    return { nodeId: response[0], nodeType: response[1], nodeName: response[2], address: response[5] };
  },
}

export const pmmClientCommands = {
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
  forceSetupAgent: async () => {
    const serverAddress = process.env.CI ? '127.0.0.1' : 'pmm-integration-server:443';
    await executeCommand(`${getClientPrefix()}pmm-agent setup --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml \
    --server-address=${serverAddress} --server-insecure-tls --server-username=admin --server-password=admin --force`)
  },
  startAgent: async () => {
    exec(`${getClientPrefix()}pmm-agent --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml`)
  },
  addMongoDb: async (address: string, password: string = "GRgrO9301RuF") => {
    await executeCommand(`${getClientPrefix()} pmm-admin add mongodb --cluster=${address} \
    --username=mongoadmin --password=${password} --environment=modb-prod mo-integration-${Date.now()}-0 --debug ${address}:27017
    `);
  }
}

export const systemCommands = {
  getRunningContainerNames: async (): Promise<string[]> => {
    return (await executeCommand('sudo docker container ls -a --format "{{.Names}}"')).stdout.split('\n');
  }
}