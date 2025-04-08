const { I } = inject();

export default class Grafana {
  constructor() {}

  checkMetricExist = async (metricName: string, refineBy: any)=> {
    let response;

    try {
      await I.asyncWaitFor(async () => {
        response = await this.getMetric(metricName, refineBy);

        return response.data.results.A.frames[0].data.values.length !== 0;
      }, 60);
    } catch (error) {
      throw new Error(`Metric with name ${metricName} was not found.`);
    }
  }

  getMetric = async (metricName: string, refineBy: any) => {
    const uid = await this.getDataSourceUidByName();
    const currentTime = Date.now();
    let refineByString = '';

    if (Array.isArray(refineBy)) {
      // Handle refineBy as an array of objects
      refineByString = refineBy
        .filter(({ type, value }) => type && value)
        .map(({ type, value }) => `${type}="${value}"`)
        .join(',');
    } else if (refineBy && refineBy.type && refineBy.value) {
      // Handle refineBy as a single object with both type and value defined
      refineByString = `${refineBy.type}="${refineBy.value}"`;
    }

    const body = {
      queries: [
        {
          refId: 'A',
          expr: refineByString ? `${metricName}{${refineByString}}` : metricName,
          range: true,
          instant: false,
          datasource: {
            type: 'prometheus',
            uid,
          },
          editorMode: 'builder',
          legendFormat: '__auto',
          useBackend: false,
          disableTextWrap: false,
          fullMetaSearch: false,
          includeNullMetadata: true,
          requestId: '17102A',
          utcOffsetSec: 19800,
          interval: '',
          datasourceId: 1,
          intervalMs: 1000,
          maxDataPoints: 757,
        },
        {
          refId: 'A-Instant',
          expr: refineByString ? `${metricName}{${refineByString}}` : metricName,
          range: false,
          instant: true,
          datasource: {
            type: 'prometheus',
            uid,
          },
          editorMode: 'builder',
          legendFormat: '__auto',
          useBackend: false,
          disableTextWrap: false,
          fullMetaSearch: false,
          includeNullMetadata: true,
          requestId: '17102A',
          utcOffsetSec: 19800,
          interval: '',
          datasourceId: 1,
          intervalMs: 1000,
          maxDataPoints: 757,
        },
      ],
      from: (currentTime - 5 * 60 * 1000).toString(),
      to: currentTime.toString(),
    };

    const headers = {
      Authorization: `Basic ${await I.getAuth()}`,
    };

    return await I.sendPostRequest(
      'graph/api/ds/query?ds_type=prometheus&requestId=explore_sbu',
      body,
      headers,
    );
  }

  getDataSourceUidByName = async (name = 'Metrics') => {
    const headers = {
      Authorization: `Basic ${await I.getAuth()}`,
    };

    const r = await I.sendGetRequest(
      'graph/api/datasources',
      headers,
    );

    return (r.data.find((d) => d.name === name)).uid;
  }
}