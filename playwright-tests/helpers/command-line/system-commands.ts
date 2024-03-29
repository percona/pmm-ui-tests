import { executeCommand } from './cliHelper';

const systemCommands = {
  getRunningContainerNames: async (): Promise<string[]> => {
    return (await executeCommand('sudo docker container ls -a --format "{{.Names}}"')).stdout.split('\n');
  },
};

export default systemCommands;
