const { I } = inject();

module.exports = {
  async signOut() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    await I.sendPostRequest('v1/Platform/SignOut', {}, headers);
  },
};
