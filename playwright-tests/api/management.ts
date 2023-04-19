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
  listRoles: async (): Promise<ListRoles | undefined> => {
    const response = await apiHelper.post('/v1/management/Role/List', {});
    if (response.status() !== 200) {
      return;
    }
    return await response.json();
  },
};
