const { MongoClient } = require('mongodb');

class MongoDB extends Helper {
  constructor(config) {
    super(config);
    this.host = config.host;
    this.port = config.port;
    this.username = config.username;
    this.password = config.password;
    this.url = `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/?authSource=admin`;
    this.client = new MongoClient(this.url, { useUnifiedTopology: true });
  }

  async connectToMongo(url) {
    return url
      ? await (new MongoClient(url, { useUnifiedTopology: true })).connect()
      : await this.client.connect();
  }

  async disconnectFromMongo() {
    await this.client.close();
  }

  async listDBs() {
    return await this.client.db('admin').admin().listDatabases();
  }

  async createCollection(dbName = 'local', collectionName = 'e2e') {
    return await this.client.db(dbName).createCollection(collectionName);
  }

  async getCollection(dbName = 'local', collectionName = 'e2e') {
    return this.client.db(dbName).collection(collectionName);
  }

  async dropCollection(dbName = 'local', collectionName = 'e2e') {
    await this.client.db(dbName).dropCollection(collectionName);
  }

  async showCollections(dbName = 'local') {
    const db = this.client.db(dbName);
    const collections = await db.listCollections();

    return await collections.toArray();
  }
}

module.exports = MongoDB;
