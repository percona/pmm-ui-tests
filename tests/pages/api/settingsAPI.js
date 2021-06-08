const assert = require('assert');

const { I, codeceptjsConfig } = inject();

const mailosaur = codeceptjsConfig.config.helpers.Mailosaur;

const defaultCheckIntervals = {
  standard_interval: '86400s',
  rare_interval: '280800s',
  frequent_interval: '14400s',
};

const endpoint = 'v1/Settings/Change';

module.exports = {
  defaultCheckIntervals,

  // methods for preparing state of application before test
  async apiEnableSTT() {
    const body = {
      enable_stt: true,
      enable_telemetry: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest(endpoint, body, headers);

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

    const resp = await I.sendPostRequest(endpoint, body, headers);

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

    const resp = await I.sendPostRequest(endpoint, body, headers);

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

    const resp = await I.sendPostRequest(endpoint, body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to enable Integrated alerting. ${resp.data.message}`,
    );
  },

  async enableAzure() {
    const body = {
      enable_azurediscover: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    await I.sendPostRequest(endpoint, body, headers);
  },

  async disableAzure() {
    const body = {
      disable_azurediscover: true,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    await I.sendPostRequest(endpoint, body, headers);
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
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    await I.sendPostRequest(endpoint, body, headers);
  },

  async setCheckIntervals(intervals = defaultCheckIntervals) {
    const body = {
      stt_check_intervals: intervals,
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    await I.sendPostRequest(endpoint, body, headers);
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

    const resp = await I.sendPostRequest(endpoint, body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to set Email Alerting settings. ${resp.data.message}`,
    );
  },

  /**
   * Change Settings API call
   *
   * @param values object
   * @param fullPayload boolean (default = false. If true - passed values object will be send as a payload)
   * @returns {Promise<void>}
   *
   * @example
   * await settingsAPI.changeSettings({ alerting: true, dbaas: true, stt: false });
   * await settingsAPI.changeSettings({ enable_alerting: true, enable_dbaas: true, disable_stt: true }, true);
   */
  async changeSettings(values, fullPayload = false) {
    const body = fullPayload ? values : {};

    if (!fullPayload) {
      Object.entries(values).forEach(([key, value]) => {
        switch (key) {
          case 'alerting':
            value ? body.enable_alerting = true : body.disable_alerting = true;
            break;
          case 'stt':
            value ? body.enable_stt = true : body.disable_stt = true;
            break;
          case 'dbaas':
            value ? body.enable_dbaas = true : body.disable_dbaas = true;
            break;
          case 'telemetry':
            value ? body.enable_telemetry = true : body.disable_telemetry = true;
            break;
          case 'azureDiscover':
            value ? body.enable_azurediscover = true : body.disable_azurediscover = true;
            break;
          case 'backup':
            value ? body.enable_backup_management = true : body.disable_backup_management = true;
            break;
          case 'publicAddress':
            value
              ? Object.assign(body, { pmm_public_address: value, remove_pmm_public_address: false })
              : body.remove_pmm_public_address = true;
            break;
          case 'data_retention':
            body.data_retention = value;
            break;
          case 'resolution':
            body.metrics_resolutions = Object.assign(body, value);
            break;
          case 'checkIntervals':
            body.stt_check_intervals = Object.assign(body, value);
            break;
          case 'alertmanagerRules':
            body.alert_manager_rules = value;
            break;
          case 'alertmanagerURL':
            body.alert_manager_url = value;
            break;
          case 'ssh':
            body.ssh_key = value;
            break;
          default:
            throw Error(`Unknown property "${key}" was passed to Change Settings function`);
        }
      });
    }

    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest(endpoint, body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to Apply settings \n${JSON.stringify(values, null, 2)}. ${resp.data.message}`,
    );
  },
};
