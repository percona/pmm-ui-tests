const { I, ncPage } = inject();
const assert = require('assert');
const faker = require('faker');

module.exports = {
  types: ncPage.types,

  async createNotificationChannel(name, type, values) {
    let body = {
      summary: name,
    };
    let webhook_config = {};

    switch (type) {
      case this.types.email.type:
        body = {
          ...body,
          email_config: {
            to: [values || this.types.email.addresses],
          },
        };
        break;
      case this.types.pagerDuty.type:
        body = {
          ...body,
          pagerduty_config: values || {
            routing_key: this.types.pagerDuty.key,
          },
        };
        break;
      case this.types.slack.type:
        body = {
          ...body,
          slack_config: {
            channel: this.types.slack.slackChannel,
          },
        };
        break;
      case this.types.webhook.type:
        webhook_config = this.createWebhookNotificationBody(values || {});

        body = {
          ...body,
          webhook_config,
        };
        break;
      default:
        assert.ok(false, `Unknown channel ${type}`);
    }
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/management/ia/Channels/Add', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to create a channel with name "${name}". Response message is "${resp.data.message}"`,
    );

    return resp.data.channel_id;
  },

  async clearAllNotificationChannels() {
    const channels = await this.getChannelsList();

    for (const i in channels) {
      const channel = channels[i];

      await this.deleteNotificationChannel(channel.channel_id);
    }
  },

  async getChannelsList() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/ia/Channels/List', {}, headers);

    return resp.data.channels;
  },

  async deleteNotificationChannel(channelId) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = { channel_id: channelId };
    const resp = await I.sendPostRequest('v1/management/ia/Channels/Remove', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to remove channel with channel_id "${channelId}". Response message is "${resp.data.message}"`,
    );
  },

  async createNotificationChannels(numberOfChannelsToCreate) {
    for (let i = 0; i < numberOfChannelsToCreate; i++) {
      await this.createNotificationChannel(`${faker.lorem.word()}_channel`, ncPage.types.email.type);
    }
  },

  createWebhookNotificationBody(parameters) {
    let basic_auth = {};
    let tls_config = {
      insecure_skip_verify: false,
    };
    let http_config = {};
    let webhook_config = {
      max_alerts: 0,
      send_resolved: false,
      url: this.types.webhook.url,
    };

    Object.entries(parameters).forEach(([key, value]) => {
      switch (key) {
        case 'url':
          webhook_config = {
            ...webhook_config,
            url: value,
          };
          break;
        case 'send_resolved':
          webhook_config = {
            ...webhook_config,
            send_resolved: value,
          };
          break;
        case 'max_alerts':
          webhook_config = {
            ...webhook_config,
            max_alerts: value,
          };
          break;
        case 'username':
          basic_auth = {
            ...basic_auth,
            username: value,
          };
          break;
        case 'password':
          basic_auth = {
            ...basic_auth,
            password: value,
          };
          break;
        case 'ca_file_content':
          tls_config = {
            ...tls_config,
            ca_file_content: value,
          };
          break;
        case 'cert_file_content':
          tls_config = {
            ...tls_config,
            cert_file_content: value,
          };
          break;
        case 'insecure_skip_verify':
          tls_config = {
            ...tls_config,
            insecure_skip_verify: value,
          };
          break;
        case 'key_file_content':
          tls_config = {
            ...tls_config,
            key_file_content: value,
          };
          break;
        case 'server_name':
          tls_config = {
            ...tls_config,
            server_name: value,
          };
          break;
        default:
          assert.ok(false, `Unknown field ${key}`);
      }
    });

    http_config = {
      ...http_config,
      basic_auth,
      tls_config,
    };

    webhook_config = {
      ...webhook_config,
      http_config,
    };

    return webhook_config;
  },
};
