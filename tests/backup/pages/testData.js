const storageLocationConnection = {
  endpoint: 'http://minio:9000',
  bucket_name: 'bcp',
  access_key: 'minio1234',
  secret_key: 'minio1234',
};

const psStorageLocationConnection = {
  endpoint: 'https://s3.us-east-2.amazonaws.com',
  bucket_name: 'pmm-backup1',
  access_key: process.env.PMM_QA_AWS_ACCESS_KEY_ID,
  secret_key: process.env.PMM_QA_AWS_ACCESS_KEY,
};

module.exports = {
  storageLocationConnection,
  psStorageLocationConnection,
};
