import pmmServerCommands from '@helpers/command-line/pmm-server-commands';
import pmmClientCommands from '@helpers/command-line/pmm-client-commands';
import systemCommands from '@helpers/command-line/system-commands';

/**
 * Command Line Commands collections wrapper.
 * To use pipe-call in tests, ex: {@code cli.systemCommands.getRunningContainerNames()}
 */
const cli = {
  pmmClientCommands,
  pmmServerCommands,
  systemCommands,
};

export default cli;
