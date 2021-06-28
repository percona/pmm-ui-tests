const { I } = inject();
const assert = require('assert');

module.exports = {
  async setAnnotation(annotationName, tags, nodeName, serviceNames) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      text: annotationName,
      tags: [tags],
      node_name: nodeName,
      service_names: [serviceNames],
    };

    const resp = await I.sendPostRequest('v1/management/Annotations/Add', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to add annotation for service/s name: ${serviceNames}. Response message is ${resp.data.message}`,
    );
  },
};
