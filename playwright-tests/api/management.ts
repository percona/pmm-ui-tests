import apiHelper from "@api/helpers/apiHelper";
import Duration from "@helpers/Duration";

export interface ListRoles {
  roles: Role[]
};

interface Role {
  role_id: number,
  title: string,
};

export const management = {
  listRoles: async (): Promise<ListRoles> => {
    const response = await apiHelper.post('/v1/management/Role/List', {});
    return await response.json()
  },
};
