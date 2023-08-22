import { test } from '@playwright/test';
import shell, { ExecOutputReturnValue } from 'shelljs';
import ExecReturn from '@helpers/types/exec-return.class';

/**
 * Shell(sh) exec() wrapper to use outside outside {@link test}
 * returns handy {@link ExecReturn} object.
 *
 * @param       command   sh command to execute
 * @return      {@link CliOutput} instance
 */
export function execute(command: string): ExecReturn {
  console.log(`exec: "${command}"`);
  const obj = shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: false });
  if (obj.stdout.length > 0) console.log(`Out: "${obj.stdout}"`);
  if (obj.stderr.length > 0) console.log(`Error: "${obj.stderr}"`);
  return new ExecReturn(command, obj);
}

/**
 * Shell(sh) exec() wrapper to return handy {@link ExecReturn} object.
 *
 * @param       command   sh command to execute
 * @return      {@link CliOutput} instance
 */
export async function exec(command: string): Promise<ExecReturn> {
  return test.step(`Run "${command}" command`, async () => {
    return execute(command);
  });
}

/**
 * Silent Shell(sh) exec() wrapper to return handy {@link ExecReturn} object.
 * Provides no logs to skip huge outputs.
 *
 * @param       command   sh command to execute
 * @return      {@link CliOutput} instance
 */
export async function execSilent(command: string): Promise<ExecReturn> {
  return new ExecReturn(
    command,
    await test.step(`Run "${command}" command`, async (): Promise<ExecOutputReturnValue> => {
      return shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: false });
    }),
  );
}

/**
 * TODO: remove in favor of exec and execSilent
 *
 * @deprecated use {@link exec} and {@link execSilent instead}
 * @param command
 * @param silent
 */
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
