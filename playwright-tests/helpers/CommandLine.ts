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

export const pmmServerCommand = {
  getNodeIds: async () => {
    const response = (await executeCommand('sudo docker exec -u postgres pmm-integration-server psql -U pmm-managed  -c "SELECT node_id FROM nodes;"')).stdout;
    return response.split(/\r?\n/).find((row) => row.includes('/node_id/'));
  }
}
