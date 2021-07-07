const { I } = inject();
const assert = require('assert');

module.exports = {
  async setAnnotation(annotationName, tags, nodeName, serviceNames, statusCode) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    let body;

    if (serviceNames) {
      body = {
        text: annotationName,
        tags: [tags],
        node_name: nodeName,
        service_names: [serviceNames],
      };
    } else {
      body = {
        text: annotationName,
        tags: [tags],
        node_name: nodeName,
      };
    }

    const resp = await I.sendPostRequest('v1/management/Annotations/Add', body, headers);

    assert.ok(
      resp.status === statusCode,
      `Failed to add annotation for ${body}. Response message is ${resp.data.message}`,
    );
  },
};
