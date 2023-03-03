import { test } from '@playwright/test';
import Output from "@support/types/output";
const shell = require('shelljs');

/**
 * Shell(sh) exec() wrapper to return handy {@link Output} object.
 *
 * @param       command   sh command to execute
 * @return      {@link Output} instance
 */
export async function exec(command: string): Promise<Output> {
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
