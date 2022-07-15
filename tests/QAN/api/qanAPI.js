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

  async getMetricsFromPGSM(database, queryId, connection) {
    let total_exec_time = 0;
    let average_exec_time = 0;
    let query_cnt = 0;
    const query_output = await I.pgExecuteQueryOnDemand(`select query, queryid, planid, query_plan, calls, total_exec_time, mean_exec_time  from pg_stat_monitor where datname='${database}' and queryid='${queryId}';`, connection);

    console.log(`Query Count is : ${query_output.rows.length}`);
    for (let i = 0; i < query_output.rows.length; i++) {
      total_exec_time += query_output.rows[i].total_exec_time;
      average_exec_time = parseFloat((query_output.rows[i].mean_exec_time / 1000).toFixed(7));
      query_cnt += parseInt(query_output.rows[i].calls, 10);
    }

    total_exec_time = parseFloat((total_exec_time / 1000).toFixed(7));

    return { total_exec_time, average_exec_time, query_cnt };
  },
};
