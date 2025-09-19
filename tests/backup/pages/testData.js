const { isOvFAmiJenkinsJob } = require('../../helper/constants');

const storageLocationConnection = {
  endpoint: isOvFAmiJenkinsJob ? 'http://127.0.0.1:9001' : 'http://minio:9000',
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

module.exports = {
  storageLocationConnection,
  psStorageLocationConnection,
};
