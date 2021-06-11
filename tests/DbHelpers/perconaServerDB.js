const { I } = inject();
const db = 'mysql';

module.exports = {
  defaultConnection: {
    host: 'mysql',
    port: 3306,
    username: 'root',
    password: 'pmm%*&agent-password',
  },

  connectToPS(connection = this.defaultConnection) {
    const {
      host, port, username, password,
    } = connection;

    I.connect(db, `mysql://${username}:${password}@${host}:${port}/mysql`);
  },

  async disconnectFromPS() {
    await I.removeConnection(db);
  },

  async dropUser(username = 'empty-user') {
    await I.run(db, `DROP USER IF EXISTS "${username}"@"localhost"`);
  },

  async createUser(username = 'empty-user', password = '') {
    if (password) {
      await I.run(db, `CREATE USER "${username}"@"localhost" IDENTIFIED BY '${password}'`);
    } else {
      await I.run(db, `CREATE USER "${username}"@"localhost"`);
    }
  },

  async setUserPassword(username = 'empty-user', password = 'password') {
    await I.run(db, `ALTER USER "${username}"@"localhost" IDENTIFIED BY '${password}'`);
  },
};
