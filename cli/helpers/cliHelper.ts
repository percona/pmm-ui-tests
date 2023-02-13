import assert from "assert";
import { test } from '@playwright/test';
import Output from "@support/types/output";
const shell = require('shelljs');

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
export async function exec(command: string, silent: boolean = false): Promise<Output> {
    const { stdout, stderr, code } = await test.step(`Run "${command}" command`, async () => {
        console.log(`Run: "${command}"`);
        return shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: false });
    });
    if (stdout.length > 0) console.log(`Out: "${stdout}"`);
    if (stderr.length > 0) console.log(`Error: "${stdout}"`);
    return new Output(command, code, stdout, stderr);
}

/**
 * Silent Shell(sh) exec() wrapper to return handy {@link Output} object.
 * Provides no logs to skip huge outputs.
 *
 * @param       command   sh command to execute
 * @return      {@link Output} instance
 */
export async function execSilent(command: string): Promise<Output> {
    const { stdout, stderr, code } = await test.step(`Run "${command}" command`, async () => {
        return shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: false });
    });
    return new Output(command, code, stdout, stderr);
}
