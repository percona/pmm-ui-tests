const mysql = require('mysql2');

let c;

const execute = (query) => new Promise((resolve, reject) => {
  c.query(query, (error, results) => {
    if (error) {
      reject(error);
    } else {
      resolve(results);
    }
  });
});

/**
 * Percona Server MySQL DB interaction module.
 * Based on "codeceptjs-dbhelper" plugin.
 */
module.exports = {
  defaultConnection: {
    host: 'mysql',
    port: 3306,
    username: 'root',
    password: 'ps',
  },

  connectToPS(connection = this.defaultConnection) {
    const {
      host, port, username, password,
    } = connection;

    c = mysql.createConnection({
      host,
      port,
      user: username,
      password,
      database: 'mysql',
    });
  },

  async disconnectFromPS() {
    await c.destroy();
  },

  async dropUser(username = 'empty-user') {
    await execute(`DROP USER IF EXISTS "${username}"@"localhost"`);
  },

  async createUser(username = 'empty-user', password = '') {
    if (password) {
      await execute(`CREATE USER "${username}"@"localhost" IDENTIFIED BY '${password}'`);
    } else {
      await execute(`CREATE USER "${username}"@"localhost"`);
    }
  },

  async setUserPassword(username = 'empty-user', password = 'password') {
    await execute(`ALTER USER "${username}"@"localhost" IDENTIFIED BY '${password}'`);
  },

  async createTable(name, columns = 'id INT AUTO_INCREMENT PRIMARY KEY, user VARCHAR(20) NOT NULL') {
    await execute(`CREATE TABLE IF NOT EXISTS \`${name}\` (${columns}) ENGINE=INNODB`);
  },

  async deleteTable(name) {
    await execute(`DROP TABLE IF EXISTS ${name}`);
  },

  async isTableExists(name) {
    return new Promise((resolve, reject) => {
      c.query(`SHOW TABLES LIKE '${name}'`, (error, results) => {
        if (error) {
          reject(error);
        } else {
          console.log(results);
          resolve(results.length > 0);
        }
      });
    });
  },
};
