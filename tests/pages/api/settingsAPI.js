const assert = require('assert');

const { I, codeceptjsConfig } = inject();

const mailosaur = codeceptjsConfig.config.helpers.Mailosaur;

const defaultCheckIntervals = {
  standard_interval: '86400s',
  rare_interval: '280800s',
  frequent_interval: '14400s',
};

module.exports = {
  defaultCheckIntervals,

  // methods for preparing state of application before test
  async apiEnableSTT() {
    const body = {
      enable_stt: true,
      enable_telemetry: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/Settings/Change', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to enabled STT. ${resp.data.message}`,
    );
  },

  async apiDisableSTT() {
    const body = {
      disable_stt: true,
      enable_telemetry: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/Settings/Change', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to disable STT. ${resp.data.message}`,
    );
  },

  async apiDisableIA() {
    const body = {
      disable_alerting: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/Settings/Change', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to disable Integrated alerting. ${resp.data.message}`,
    );
  },

  async apiEnableIA() {
    const body = {
      enable_alerting: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/Settings/Change', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to enable Integrated alerting. ${resp.data.message}`,
    );
  },

  async restoreSettingsDefaults() {
    const body = {
      data_retention: '2592000s',
      metrics_resolutions: {
        hr: '5s',
        mr: '10s',
        lr: '60s',
      },
      enable_telemetry: true,
      disable_stt: true,
      email_alerting_settings: { from: '1', smarthost: '1', hello: '1' },
      slack_alerting_settings: { url: '1' },
      disable_azurediscover: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    await I.sendPostRequest('v1/Settings/Change', body, headers);
  },

  async setCheckIntervals(intervals = defaultCheckIntervals) {
    const body = {
      stt_check_intervals: intervals,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    await I.sendPostRequest('v1/Settings/Change', body, headers);
  },

  async setEmailAlertingSettings(settings) {
    const body = {
      email_alerting_settings: settings || {
        from: 'pmm@mail.com',
        smarthost: 'mailosaur.net:465',
        username: `${mailosaur.serverId}@mailosaur.net`,
        password: process.env.MAILOSAUR_SMTP_PASSWORD,
      },
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/Settings/Change', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to set Email Alerting settings. ${resp.data.message}`,
    );
  },
};
