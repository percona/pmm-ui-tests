const { I } = inject();
const db = 'mysql';

/**
 * Percona Server MySQL DB interaction module.
 * Based on "codeceptjs-dbhelper" plugin.
 */
module.exports = {
  defaultConnection: {
    host: 'mysql',
    port: 3309,
    username: 'root',
    password: 'ps',
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

  async createTable(name, columns = 'id INT AUTO_INCREMENT PRIMARY KEY, user VARCHAR(20) NOT NULL') {
    await I.run(db, `CREATE TABLE IF NOT EXISTS \`${name}\` (${columns}) ENGINE=INNODB`);
  },

  async deleteTable(name) {
    await I.run(db, `DROP TABLE IF EXISTS ${name};`);
  },

  async isTableExists(name) {
    const result = await I.query(db, `SHOW TABLES LIKE "${name}";`);

    return result.length > 0;
  },
};
