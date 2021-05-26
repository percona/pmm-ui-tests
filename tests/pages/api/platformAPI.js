const assert = require('assert');

const { I } = inject();

module.exports = {
  async signOut() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    await I.sendPostRequest('v1/Platform/SignOut', {}, headers);
  },
  async signIn(email = process.env.PORTAL_USER_EMAIL, password = process.env.PORTAL_USER_PASSWORD) {
    const body = {
      email,
      password,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/Platform/SignIn', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to Sign In to the Percona Platform. Response message is "${resp.data.message}"`,
    );
  },
};
