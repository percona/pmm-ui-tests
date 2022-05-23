const assert = require('assert');

const { I } = inject();

module.exports = {
  async getMetricByFilterAPI(filter_value, filter_group, labels, fromTime, toTime) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const data = {
      filter_by: filter_value,
      group_by: filter_group,
      labels,
      period_start_from: fromTime,
      period_start_to: toTime,
      totals: false,
    };
    const resp = await I.sendPostRequest('v0/qan/ObjectDetails/GetMetrics', data, headers);

    return resp;
  },
};
