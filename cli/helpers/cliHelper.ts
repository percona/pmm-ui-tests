import assert from "assert";
import Output from "@support/types/output";
const shell = require('shelljs');

export function verifyCommand(command, result = 'pass', getError = false): Output {
    const { stdout, stderr, code } = shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: true });
    console.log(stdout);
    console.log(stderr);
    console.log(code);
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
export function exec(command): Output {
    const { stdout, stderr, code } = shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), {silent: true});
    console.log(stdout);
    console.log(stderr);
    console.log(code);
    return new Output(command, code, stdout, stderr);
}

// export const cli = {
//     async verifyCommand(command, result = 'pass', getError = false) {
//         const {stdout, stderr, code} = shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), {silent: true});
//
//         if (result === 'pass') {
//             assert.ok(code === 0, `The command ${command} was expected to run without any errors, the error found ${stderr}`);
//         } else {
//             assert.ok(code !== 0, `The command ${command} was expected to return with failure but found to be executing without any error, the return code found ${code}`);
//         }
//
//         if (!getError) return stdout;
//
//         return stderr;
//     },
// };