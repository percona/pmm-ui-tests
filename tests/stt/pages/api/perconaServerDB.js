const { I, codeceptjsConfig } = inject();
const url = new URL(codeceptjsConfig.config.helpers.Playwright.url);
const db = 'mysql';

module.exports = {
  connectToPS() {
    I.connect(db, `mysql://root:ps@${url.host}:43306/mysql`);
  },
  async disconnectFromPS() {
    await I.removeConnection(db);
  },
  async dropUser(username = 'empty-user') {
    await I.run(db, `DROP USER IF EXISTS "${username}"@"localhost"`);
  },
  async createUser(username = 'empty-user', password = '') {
    await I.run(db, `CREATE USER "${username}"@"localhost" IDENTIFIED BY "${password}"`);
  },
  async setUserPassword(username = 'empty-user', password = 'password') {
    await I.run(db, `SET PASSWORD FOR "${username}"@"localhost" = PASSWORD("${password}")`);
  },
};
