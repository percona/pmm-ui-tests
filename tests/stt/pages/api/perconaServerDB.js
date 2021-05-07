const { I } = inject();
const db = 'mysql';

module.exports = {
  connectToPS(connection) {
    const {
      host, port, username, password,
    } = connection;

    I.connect(db, `mysql://${username}:${password}@${host}:${port}/mysql`);
  },

  async disconnectFromPS() {
    await I.removeConnection(db);
  },

  async dropUser(username = 'empty_user') {
    await I.run(db, `DROP USER IF EXISTS "${username}"@"localhost"`);
  },

  async createUser(username = 'empty_user', password = '') {
    if (password === '') {
      await I.run(db, `CREATE USER "${username}"@"localhost"`);
    } else {
      await I.run(db, `CREATE USER "${username}"@"localhost" IDENTIFIED BY "${password}"`);
    }
  },

  async setUserPassword(username = 'empty_user', password = 'password') {
    await I.run(db, `ALTER USER "${username}"@"localhost" IDENTIFIED BY '${password}'`);
  },
};
