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
      `Failed to add annotation for ${body}. Response message is ${resp.data.message}`,
    );

    return resp.status;
  },

  async setAnnotationWithoutServiceName(annotationName, tags, nodeName) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      text: annotationName,
      tags: [tags],
      node_name: nodeName,
    };

    const resp = await I.sendPostRequest('v1/management/Annotations/Add', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to add annotation for ${body}. Response message is ${resp.data.message}`,
    );
  },
};
