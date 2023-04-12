import shell from 'shelljs';
import { exec } from "child_process";
import pmmClientCommands from './commandLine/pmmClientCommands';
import systemCommands from './commandLine/systemCommands';
import pmmServerCommands from './commandLine/pmmServerCommands';


const cli = {
  pmmClientCommands: pmmClientCommands,
  pmmServerCommands: pmmServerCommands,
  systemCommands: systemCommands,
}

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

export default cli;
