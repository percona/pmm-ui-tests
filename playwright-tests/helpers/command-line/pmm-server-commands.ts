import { executeCommand } from './cliHelper';

const pmmServerCommands = {
  getNodeDetails: async (nodeId: string) => {
    const response = (await executeCommand(`sudo docker exec -u postgres pmm-integration-server psql -U pmm-managed  -c "SELECT * FROM nodes WHERE node_id = '${nodeId}'; " | grep '/node_id/'`))
      .stdout.replaceAll('|', '').replace(/ +(?= )/g, '').split(' ').filter((row) => row !== '');
    return { nodeId: response[0], nodeType: response[1], nodeName: response[2], address: response[5] };
  },
}

export default pmmServerCommands;
