import * as cli from '@helpers/cli-helper';

export const createPMMUser = async (username: string, password: string, containerName?: string) => {
  const user = {
    user: '${newPMMUsername}',
    pwd: '${newPMMPassword}',
    roles: [
      { role: 'explainRole', db: 'admin' },
      { role: 'clusterMonitor', db: 'admin' },
      { role: 'read', db: 'local' },
      { db: 'admin', role: 'readWrite', collection: '' },
      { db: 'admin', role: 'backup' },
      { db: 'admin', role: 'clusterMonitor' },
      { db: 'admin', role: 'restore' },
      { db: 'admin', role: 'pbmAnyAction' },
    ],
  };
  const output = await cli.exec(
    `${
      containerName ? `docker exec ${containerName}` : ''
    } mongosh "mongodb://root:root@127.0.0.1:27017/admin?authSource=admin" --quiet --eval 'db.getSiblingDB("admin").createUser(${JSON.stringify(user)});'`,
  );
  await output.assertSuccess();
};
