const { I } = inject();

/**
 * Single Collection of credentials to use in tests.
 * Main purpose to keep it in single place for easy update and maintenance.
 */
module.exports = {
  mongoDb: {
    user: 'pmm_mongodb',
    password: 'GRgrO9301RuF',
    // eslint-disable-next-line no-inline-comments
    port: '27023', // This is the port used by --addclient=modb,1 and docker-compose setup on a CI/CD
    adminUser: 'mongoadmin',
    adminPassword: 'GRgrO9301RuF',
  },
  mongoReplicaPrimaryForBackups: {
    host: '127.0.0.1',
    port: '27027',
    username: 'pmm',
    password: 'pmmpass',
  },
  postgreSql: {
    port: '5433',
    pmmServerUser: 'pmm-managed',
    pmmServerPassword: 'pmm-managed',
  },

  async detectPort(serviceName) {
    return await I.verifyCommand(`pmm-admin list | grep ${serviceName} | awk -F " " '{print $3}' | awk -F ":" '{print $2}'`);
  },
};
