const { I, ncPage } = inject();
const assert = require('assert');
const faker = require('faker');

module.exports = {
  types: ncPage.types,

  async createNotificationChannel(name, type, values) {
    let body = {
      summary: name,
    };

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
          pagerduty_config: {
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
        const http_config = this.createWebhookNotificationBody(values);
        body = {
          ...body,
          webhook_config: {
            http_config
          },
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
    let webhook_config = {};

    Object.entries(parameters).forEach(([key, value]) => {
      switch (key) {
        case 'name':
          webhook_config = {
            ...webhook_config,
            http_config: {
              name: value || this.types.webhook.name,
            },
          };
          break;
        case 'type':
          webhook_config = {
            ...webhook_config,
            http_config: {
              type: value || this.types.webhook.type,
            },
          };
          break;
        case 'url':
          webhook_config = {
            ...webhook_config,
            http_config: {
              url: value,
            },
          };
          break;
        case 'username':
          webhook_config = {
            ...webhook_config,
            http_config: {
              basic_auth: {
                username: value,
              },
            },
          };
          break;
        case 'password':
          webhook_config = {
            ...webhook_config,
            http_config: {
              basic_auth: {
                password: value,
              },
            },
          };
          break;
        case 'send_resolved':
          webhook_config = {
            ...webhook_config,
            http_config: {
              send_resolved: value || this.types.webhook.send_resolved,
            },
          };
          break;
        case 'max_alerts':
          webhook_config = {
            ...webhook_config,
            http_config: {
              max_alerts: value || this.types.webhook.max_alerts,
            },
          };
          break;
        case 'ca_file_content':
          webhook_config = {
            ...webhook_config,
            http_config: {
              tls_config: {
                ca_file_content: value,
              },
            },
          };
          break;
        case 'cert_file_content':
          webhook_config = {
            ...webhook_config,
            http_config: {
              tls_config: {
                cert_file_content: value,
              },
            },
          };
          break;
        case 'insecure_skip_verify':
          webhook_config = {
            ...webhook_config,
            http_config: {
              tls_config: {
                insecure_skip_verify: value || this.types.webhook.tls_config.insecure_skip_verify,
              },
            },
          };
          break;
        case 'key_file_content':
          webhook_config = {
            ...webhook_config,
            http_config: {
              tls_config: {
                key_file_content: value,
              },
            },
          };
          break;
        case 'server_name':
          webhook_config = {
            ...webhook_config,
            http_config: {
              tls_config: {
                server_name: value,
              },
            },
          };
          break;
        default:
          assert.ok(false, `Unknown field ${key}`);
      }
    });

    return webhook_config;
  },
};
