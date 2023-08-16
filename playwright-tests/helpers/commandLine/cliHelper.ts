import { test } from '@playwright/test';
import shell, { ExecOutputReturnValue } from 'shelljs';
import { CliOutput } from '@helpers/types/CliOutput';

/**
 * Shell(sh) exec() wrapper to use outside outside {@link test}
 * returns handy {@link CliOutput} object.
 *
 * @param       command   sh command to execute
 * @return      {@link CliOutput} instance
 */
export function execute(command: string): CliOutput {
  console.log(`exec: "${command}"`);
  const obj = shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: false });
  if (obj.stdout.length > 0) console.log(`Out: "${obj.stdout}"`);
  if (obj.stderr.length > 0) console.log(`Error: "${obj.stderr}"`);
  return new CliOutput(command, obj);
}

/**
 * Shell(sh) exec() wrapper to return handy {@link CliOutput} object.
 *
 * @param       command   sh command to execute
 * @return      {@link CliOutput} instance
 */
export async function exec(command: string): Promise<CliOutput> {
  return test.step(`Run "${command}" command`, async () => {
    return execute(command);
  });
}

/**
 * Silent Shell(sh) exec() wrapper to return handy {@link CliOutput} object.
 * Provides no logs to skip huge outputs.
 *
 * @param       command   sh command to execute
 * @return      {@link CliOutput} instance
 */
export async function execSilent(command: string): Promise<CliOutput> {
  return new CliOutput(
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
