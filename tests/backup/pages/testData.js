const storageLocationConnection = {
  endpoint: 'https://s3.amazonaws.com',
  bucket_name: 'pmm-backup1',
  access_key: process.env.BACKUP_LOCATION_ACCESS_KEY,
  secret_key: process.env.BACKUP_LOCATION_SECRET_KEY,
};

module.exports = {
  storageLocationConnection,
};
