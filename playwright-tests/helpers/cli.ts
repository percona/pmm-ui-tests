import pmmServerCommands from '@helpers/commandLine/pmmServerCommands';
import pmmClientCommands from '@helpers/commandLine/pmmClientCommands';
import systemCommands from '@helpers/commandLine/systemCommands';

/**
 * Command Line Commands collections wrapper.
 * To use pipe-call in tests, ex: {@code cli.systemCommands.getRunningContainerNames()}
 */
export const cli = {
  pmmClientCommands,
  pmmServerCommands,
  systemCommands,
};
