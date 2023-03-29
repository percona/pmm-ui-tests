import shell from 'shelljs';

export const executeCommand = async (command: string) => {
  const { stdout, stderr, code } = shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: true });

  if (code === 0) {
    console.log(`The command ${command} was run successfully with result: ${stdout}`);
  } else {
    throw new Error(`The command ${command} failed with error: ${stderr}`);
  }

  return { stdout, stderr };
};

export const pmmServerCommands = {
  getNodeDetails: async (nodeId: string) => {
    const response = (await executeCommand(`sudo docker exec -u postgres pmm-integration-server psql -U pmm-managed  -c "SELECT * FROM nodes WHERE node_id = '${nodeId}'; " | grep '/node_id/'`))
      .stdout.replaceAll('|', '').replace(/ +(?= )/g, '').split(' ').filter((row) => row !== '');
    console.log(response)

    return { nodeId: response[0], nodeType: response[1], nodeName: response[2], address: response[5] };
  },

}

export const pmmClientCommands = {
  getNodeId: async () => {
    const prefix = process.env.CI ? 'sudo ' : 'sudo docker exec pmm-integration-client ';
    return (await executeCommand(`${prefix}pmm-admin status | grep "Node ID"`)).stdout.replaceAll(' ', '').replace('NodeID:', '');
  }
}
