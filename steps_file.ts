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
    }
  });
}
