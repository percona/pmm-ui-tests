const storageLocationConnection = {
  endpoint: 'http://minio:9000',
  bucket_name: 'bcp',
  access_key: 'minio1234',
  secret_key: 'minio1234',
};

const psStorageLocationConnection = {
  endpoint: 'https://s3.us-east-2.amazonaws.com',
  bucket_name: 'pmm-backup1',
  access_key: process.env.BACKUP_LOCATION_ACCESS_KEY,
  secret_key: process.env.BACKUP_LOCATION_SECRET_KEY,
};

const storageLocationConnectionShardedCluster = {
  endpoint: 'http://minio:9000',
  bucket_name: 'bcp-sharded',
  access_key: 'minio1234',
  secret_key: 'minio1234',
};

const storageLocationConnectionReplicaset = {
  endpoint: 'http://minio:9000',
  bucket_name: 'bcp-replicaset',
  access_key: 'minio1234',
  secret_key: 'minio1234',
};

module.exports = {
  storageLocationConnection,
  psStorageLocationConnection,
  storageLocationConnectionShardedCluster,
  storageLocationConnectionReplicaset,
};
