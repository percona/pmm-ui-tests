const { I } = inject();
const { storageLocationConnection } = require('../testData');

module.exports = {
  async createStorageLocation(locationObj) {
    const {
      name,
      description = '',
      type = 's3_config',
      endpoint = storageLocationConnection.endpoint,
      access_key = storageLocationConnection.access_key,
      secret_key = storageLocationConnection.secret_key,
      bucket_name = storageLocationConnection.bucket_name,
    } = locationObj;
    const body = {
      name,
      description,
      [type]: {
        endpoint,
        access_key,
        secret_key,
        bucket_name,
      },
    };

    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/management/backup/Locations/Add', body, headers);

    I.assertEqual(
      resp.status, 200,
      `Failed to create a storage location with name "${name}". Response message is "${resp.data.message}"`,
    );

    return resp.data.location_id;
  },

  async clearAllLocations() {
    const locations = await this.getLocationsList();

    if (!locations) return;

    for (const { location_id } of locations) {
      await this.removeLocation(location_id, true);
    }
  },

  async getLocationsList() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/backup/Locations/List', {}, headers);

    return resp.data.locations;
  },

  /**
   * Lookup and return Storage location fully matching specified name.
   *
   * @param   nameOfLocation  name {@code String} of the Location to lookup
   * @return                  {Promise<unknown>} Location object if found; {@code null} otherwise
   */
  async getLocationDetails(nameOfLocation) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/backup/Locations/List', {}, headers);
    const result = Object.values(resp.data)
      .flat(Infinity)
      .filter(({ name }) => name === nameOfLocation);

    if (result.length) return result[0];

    await I.say(`Storage Location with name "${nameOfLocation}" not found!`);

    return null;
  },

  async removeLocation(locationId, force) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      force,
      location_id: locationId,
    };
    const resp = await I.sendPostRequest('v1/management/backup/Locations/Remove', body, headers);

    I.assertEqual(
      resp.status, 200,
      `Failed to remove storage location with ID "${locationId}". Response message is "${resp.data.message}"`,
    );
  },
};
