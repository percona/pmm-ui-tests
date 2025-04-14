import shell from "shelljs";
import assert from "assert";

export = function() {
  return actor({
    async Authorize(username = 'admin', password = process.env.ADMIN_PASSWORD) {
      const { Playwright } = this.helpers;
      const basicAuthEncoded = await this.getAuth(username, password);

      Playwright.setPlaywrightRequestHeaders({ Authorization: `Basic ${basicAuthEncoded}` });
    },
    async getAuth(username = 'admin', password = process.env.ADMIN_PASSWORD) {
      return Buffer.from(`${username}:${password}`).toString(
        'base64',
      );
    },
    async verifyCommand(command, output = null, result = 'pass', returnErrorPipe = false) {
      const { stdout, stderr, code } = shell.exec(command.replace(/(\r\n|\n|\r)/gm, ''), { silent: true });

      if (output && result === 'pass') {
        assert.ok(stdout.includes(output), `The "${command}" output expected to include "${output}" but found "${stdout}"`);
      }

      if (result === 'pass') {
        assert.ok(code === 0, `The "${command}" command was expected to run without any errors, but the error found: "${stderr || stdout}"`);
      } else {
        assert.ok(code !== 0, `The "${command}" command was expected to exit with error code, but exited with success code: "${code}"`);
      }

      if (returnErrorPipe) return stderr.trim();

      return stdout.trim();
    },
    /**
     * Fluent wait for the specified callable. Callable should be async and return bool value
     * Fails test if timeout exceeded.
     *
     * @param     boolCallable      should be a function with boolean return type
     * @param     timeOutInSeconds  time to wait for a service to appear
     * @returns   {Promise<void>}   requires await when called
     */
    async asyncWaitFor(boolCallable, timeOutInSeconds) {
      const start = new Date().getTime();
      const timeout = timeOutInSeconds * 1000;
      const interval = 1;

      /* eslint no-constant-condition: ["error", { "checkLoops": false }] */
      while (true) {
        // Main condition check
        if (await boolCallable()) {
          return;
        }

        // Check the timeout after evaluating main condition
        // to ensure conditions with a zero timeout can succeed.
        if (new Date().getTime() - start >= timeout) {
          assert.fail(`"${boolCallable.name}" is false: 
        tried to check for ${timeOutInSeconds} second(s) with ${interval} second(s) with interval`);
        }

        await this.wait(interval);
      }
    }
  });
}
