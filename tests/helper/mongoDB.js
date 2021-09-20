const { MongoClient } = require('mongodb');

class MongoDBHelper extends Helper {
  constructor(config) {
    super(config);
    this.host = config.host;
    this.port = config.port;
    this.username = config.username;
    this.password = config.password;
    this.url = `mongodb://${config.username}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/?authSource=admin`;
    this.client = new MongoClient(this.url, { useUnifiedTopology: true });
  }

  /**
   * Connects to mongo shell. Takes options from the Helper config by default
   * if url param is passed - it is used for a connection
   * @returns {Promise<*>}
   * @param connection
   */
  async mongoConnect(connection) {
    const {
      host, port, username, password,
    } = connection;

    if (host) this.host = host;

    if (port) this.port = port;

    if (username) this.username = username;

    if (password) this.password = password;

    this.url = `mongodb://${this.username}:${encodeURIComponent(this.password)}@${this.host}:${this.port}/?authSource=admin`;
    this.client.s.url = this.url;

    return await this.client.connect();
  }

  async mongoConnectReplica(connection) {
    const {
      host, port, username, password,
    } = connection;

    if (host) this.host = host;

    if (port) this.port = port;

    if (username) this.username = username;

    if (password) this.password = password;

    this.url = `mongodb://${this.username}:${encodeURIComponent(this.password)}@${this.host}:27027,${this.host}:27028,${this.host}:27029/?authSource=admin&replicaSet=rs0`;
    this.client.s.url = this.url;

    return await this.client.connect();
  }

  /**
   * Disconnects from mongo shell
   * @returns {Promise<void>}
   */
  async mongoDisconnect() {
    await this.client.close();
  }

  /**
   * Runs a command against the current database
   * read more here: https://docs.mongodb.com/manual/reference/command/
   * @example await I.mongoExecuteCommand({ getLastError: 1 })
   * @param cmdObj
   * @param db
   * @returns {Promise<*>}
   */
  async mongoExecuteCommand(cmdObj, db) {
    return await this.client.db(db).command(cmdObj);
  }

  /**
   * Runs an administrative command against the admin database
   * read more here: https://docs.mongodb.com/manual/reference/command/
   * @example await I.mongoExecuteAdminCommand({ listDatabases: 1 })
   * @param cmdObj
   * @returns {Promise<*>}
   */
  async mongoExecuteAdminCommand(cmdObj) {
    return await this.client.db().admin().command(cmdObj);
  }

  /**
   * Creates new user
   * @param username
   * @param password
   * @param rolesArr
   * @returns {Promise<unknown>}
   */
  async mongoAddUser(username, password, rolesArr) {
    const { roles = [{ role: 'userAdminAnyDatabase', db: 'admin' }] } = rolesArr;

    return this.client.db().admin().addUser(username, password, { roles });
  }

  /**
   * Removes a user
   * @param username
   * @returns {Promise<*>}
   */
  async mongoRemoveUser(username) {
    return await this.client.db().admin().removeUser(username);
  }

  /**
   * Returns databases list
   * @returns {Promise<*>}
   */
  async mongoListDBs() {
    return await this.client.db().admin().listDatabases();
  }

  /**
   * Creates a collection in a database and returns collection object
   * @example
   * const col = await I.mongoCreateCollection('local', 'e2e');
   * await col.insertOne({ a: '111' });
   * await col.find().toArray()
   * @param dbName
   * @param collectionName
   * @returns {Promise<*>}
   */
  async mongoCreateCollection(dbName, collectionName) {
    return await this.client.db(dbName).createCollection(collectionName);
  }

  /**
   * Returns collection object for further use
   * @example
   * const col = await I.mongoGetCollection('local', 'e2e');
   * await col.insertOne({ a: '111' });
   * @param dbName
   * @param collectionName
   * @returns {Promise<Collection>}
   */
  async mongoGetCollection(dbName, collectionName) {
    return this.client.db(dbName).collection(collectionName);
  }

  /**
   * Deletes a collection in a database
   * @param dbName
   * @param collectionName
   * @returns {Promise<*>}
   */
  async mongoDropCollection(dbName, collectionName) {
    return await this.client.db(dbName).dropCollection(collectionName);
  }

  /**
   * Returns collections in a database
   * @param dbName
   * @returns {Promise<*>}
   */
  async mongoShowCollections(dbName) {
    const collections = await this.client.db(dbName).listCollections();

    return await collections.toArray();
  }
}

module.exports = MongoDBHelper;
