import assert from 'assert';
import { test } from '@playwright/test';
import Output from '@support/types/output';
import * as shell from 'shelljs';

export function verifyCommand(command, result = 'pass', getError = false): Output {
  const { stdout, stderr, code } = shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: true });
  if (result === 'pass') {
    assert.ok(code === 0, `The command ${command} was expected to run without any errors, the error found ${stderr}`);
  } else {
    assert.ok(code !== 0, `The command ${command} was expected to return with failure but found to be executing without any error, the return code found ${code}`);
  }

  if (!getError) return stdout;

  return stderr;
}

/**
 * Shell(sh) exec() wrapper to return handy {@link Output} object.
 *
 * @param       command   sh command to execute
 * @return      {@link Output} instance
 */
export async function exec(command): Promise<Output> {
  const { stdout, stderr, code } = await test.step(`Run "${command}" command`, async () => {
    return shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: false });
  });

  return new Output(command, code, stdout, stderr);
}

/**
 * Fluent wait for the specified callable. Callable should be async and return bool value
 * Fails test if timeout exceeded.
 *
 * @param     boolCallable      should be a function with boolean return type
 * @param     timeOutInSeconds  time to wait for a service to appear
 * @returns   {Promise<void>}   requires await when called
 */
export async function asyncWaitFor(boolCallable: unknown, timeOutInSeconds: number = 120) {
  const start = new Date().getTime();
  const timout = timeOutInSeconds * 1000;
  const interval = 1;

  /* eslint no-constant-condition: ["error", { "checkLoops": false }] */
  while (true) {
    // Main condition check
    if (await boolCallable()) {
      return;
    }

    // Check the timeout after evaluating main condition
    // to ensure conditions with a zero timeout can succeed.
    if (new Date().getTime() - start >= timout) {
      assert.fail(`"${boolCallable?.name}" is false: 
        tried to check for ${timeOutInSeconds} second(s) with ${interval} second(s) with interval`);
    }

    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, interval * 1000));
  }
}
