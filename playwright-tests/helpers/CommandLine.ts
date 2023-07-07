import shell from 'shelljs';
import pmmClientCommands from './commandLine/pmmClientCommands';
import systemCommands from './commandLine/systemCommands';
import pmmServerCommands from './commandLine/pmmServerCommands';

const cli = {
  pmmClientCommands,
  pmmServerCommands,
  systemCommands,
};

export const executeCommand = async (command: string, silent = true) => {
  const { stdout, stderr, code } = shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), {
    silent: true,
  });

  if (code === 0) {
    if (!silent) {
      console.log(`The command ${command} was run successfully with result: ${stdout}`);
    }
  } else {
    throw new Error(`The command ${command} failed with error: ${stderr}`);
  }

  return {
    stdout, stderr,
  } as { stdout: string, stderr: string };
};

export default cli;
