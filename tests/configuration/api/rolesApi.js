const { I, settingsAPI } = inject();

class RolesApi {
  constructor() {
    this.deleteUrl = 'v1/management/Role/Delete';
    this.createUrl = 'v1/management/Role/Create';
    this.listUrl = 'v1/management/Role/List';
    this.assignUrl = 'v1/management/Role/Assign';
  }

  async assignRole(role_ids, user_id) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = { role_ids, user_id };

    await I.sendPostRequest(this.assignUrl, body, headers);
  }

  async deleteRole(role_id, replacement_role_id = 1) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = { replacement_role_id, role_id };

    await I.sendPostRequest(this.deleteUrl, body, headers);
  }

  async deleteRoles(rolesId, replacement_role_id = 1) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    for await (const role_id of rolesId) {
      await this.deleteRole(role_id, replacement_role_id);
    }
  }

  async createRole(role) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      description: role.description,
      filter: `{${role.label}${role.operator}"${role.value}"}`,
      title: role.name,
    };

    return (await I.sendPostRequest(this.createUrl, body, headers)).data.role_id;
  }

  async listRoles() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    return (await I.sendPostRequest(this.listUrl, {}, headers)).data.roles;
  }

  async getNonDefaultRolesIds() {
    const rolesId = [];
    const defaultRoleId = await settingsAPI.getSettings('default_role_id');
    const roles = (await this.listRoles());

    roles.forEach((role) => {
      if (role.role_id !== defaultRoleId) {
        rolesId.push(role.role_id);
      }
    });

    return rolesId;
  }
}

module.exports = new RolesApi();
module.exports.ProductTourDialog = RolesApi;
