const assert = require('assert');

const { I } = inject();

module.exports = {
  async verifyAmazonInstanceId(instanceId) {
    const body = {
      instance_id: instanceId,
    };
    const response = await I.sendPostRequest('v1/AWSInstanceCheck', body);

    assert.ok(
      response.status === 200,
      `Failed to validate AMI Instance with instance id as "${instanceId}". Response message is "${response.data.message}"`,
    );
  },
};
