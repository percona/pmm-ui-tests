import apiHelper from "@api/helpers/apiHelper";
import Duration from "@helpers/Duration";

interface ListRoles {
  roles: Role[]
};

interface Role {
  role_id: number,
  title: string,
};

export const management = {
  listRoles: async (): Promise<ListRoles> => {
    const response = await apiHelper.get('/v1/management/Role/List', { timeout: Duration.ThreeMinutes });
    return await response.json()
  },
};
