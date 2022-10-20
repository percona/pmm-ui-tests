const { I } = inject();
const assert = require('assert');
const faker = require('faker');

module.exports = {
  async createAlertRule(ruleObj, folder, templateName) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const {
      ruleName, severity, filters, params, duration, channels, disabled //todo: channels, disabled, etc?
    } = ruleObj;
    const body = {
      custom_labels: {},
      disabled: disabled || false,
      channel_ids: channels || [],
      filters: filters || [
        {
          key: 'service_name',
          value: 'pmm-server-postgresql',
          type: 'MATCH',
        },
      ],
      for: `${(duration || 60)}s`,
      severity: severity || 'SEVERITY_CRITICAL',
      template_name: templateName || 'pmm_postgresql_too_many_connections',
      name: ruleName || 'Test Rule',
      params: params || [
        {
          name: 'threshold',
          type: 'FLOAT',
          float: 1,
        },
      ],
      group: 'default-alert-group',
      folder_uid: await this.getFolderUID(folder),
    };
    const resp = await I.sendPostRequest('v1/management/alerting/Rules/Create', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to create alert rule with "${ruleName}". Response message is "${resp.data.message}"`,
    );
  },

  async updateAlertRule(ruleObj, templateName) {
    const {
      ruleId, ruleName, filters, severity, params, duration,
    } = ruleObj;

    const body = {
      custom_labels: {},
      disabled: false,
      channel_ids: [],
      filters: filters || [
        {
          key: 'service_name',
          value: 'pmm-server-postgresql',
          type: 'EQUAL',
        },
      ],
      for: `${(duration || 1)}s`,
      rule_id: ruleId,
      severity: severity || 'SEVERITY_CRITICAL',
      template_name: templateName || 'pmm_postgresql_too_many_connections',
      name: ruleName,
      params: params || [
        {
          name: 'threshold',
          type: 'FLOAT',
          float: 1,
        },
      ],
    };
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/management/ia/Rules/Update', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to update alert rule with "${ruleName}". Response message is "${resp.data.message}"`,
    );
  },

  async clearAllRules(force = false) {
    const rules = await this.getAlertRules();
    let rulesToDelete;

    // return if no rules found
    if (!rules) return;

    if (!force) {
      rulesToDelete = rules.filter((rule) => !rule.summary.includes('immortal'));
    } else {
      rulesToDelete = rules;
    }

    for (const i in rulesToDelete) {
      const rule = rulesToDelete[i];

      await this.removeAlertRule(rule.rule_id);
    }
  },

  async getAlertRules() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/ia/Rules/List', {}, headers);

    return resp.data.rules;
  },

  async removeAlertRule(folder) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendDeleteRequest(`/graph/api/ruler/grafana/api/v1/rules/${folder}/default-alert-group?subtype=cortex`, headers);

    assert.ok(
      resp.status === 202,
      `Failed to remove alert rule. Response message is "${resp.data.message}"`,
    );
  },

  async getAlertNameFromRule(ruleId) {
    const rules = await this.getAlertRules();

    const rule = rules.filter((rule) => rule.rule_id === ruleId);

    return rule[0].template.annotations.summary.replace('{{ $labels.service_name }}', rule[0].filters[0].value);
  },

  async createAlertRules(numberOfRulesToCreate) {
    for (let i = 0; i < numberOfRulesToCreate; i++) {
      await this.createAlertRule({ ruleName: `${faker.lorem.word()}_alert_rule` });
    }
  },

  async getFolderUID(folderName) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendGetRequest('graph/api/folders', headers);
    const foldersArray = resp.data;

    for (const i in foldersArray) {
      if (foldersArray[i].title === folderName) {
        const folderUID = foldersArray[i].uid;
        return folderUID;
      }
    }
  }
};
