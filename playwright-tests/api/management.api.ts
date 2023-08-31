import apiHelper from '@api/helpers/api-helper';

export interface ListRoles {
  roles: Role[]
}

interface Role {
  role_id: number,
  title: string,
}

export const managementApi = {
  listRoles: async (): Promise<ListRoles | undefined> => {
    const response = await apiHelper.post('/v1/management/Role/List', {});
    return await response.json() as ListRoles;
  },

  listServices: async (): Promise<any | undefined> => {
    const response = await apiHelper.post('/v1/management/Service/List', {});
    return response.json();
  },

};
