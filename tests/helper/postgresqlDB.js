const pg = require('pg');

class PostgresqlDBHelper extends Helper {
  constructor(config) {
    super(config);
    this.host = config.host;
    this.port = config.port;
    this.user = config.user;
    this.password = config.password;
    this.database = config.database;
    this.client = new pg.Client({
      user: this.user,
      host: this.host,
      database: this.database,
      password: this.password,
      port: this.port,
    });
  }

  /**
   * Connects to PG shell .Accept options from the Helper config by default
   * @returns {Promise<*>}
   * @param {connection} [connection] - taken from codeceptjs config
   */
  async pgConnect(connection) {
    if (connection) {
      const {
        host,
        port,
        user,
        password,
        database,
      } = connection;

      if (host) this.host = host;

      if (port) this.port = port;

      if (user) this.user = user;

      if (password) this.password = password;

      if (database) this.database = database;
    }

    this.client = new pg.Client({
      user: this.user,
      host: this.host,
      database: this.database,
      password: this.password,
      port: this.port,
    });

    return await this.client.connect();
  }

  /**
   * Disconnects from PG shell
   * @returns {Promise<void>}
   */
  async pgDisconnect() {
    await this.client.end();
  }

  /**
   * Queries all records from pg_catalog.pg_tables
   * @returns {Promise<void>}
   */
  async pgShowTables() {
    return await this.client.query('SELECT * FROM pg_catalog.pg_tables');
  }
}

module.exports = PostgresqlDBHelper;
