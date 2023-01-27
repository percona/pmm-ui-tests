import { portalAPIHelper } from "./helpers/portalApiHelper";

export const portalAPI = {
  async getUserAccessToken(username: string, password: string) {
  const response = await portalAPIHelper.post({
    path: '/v1/auth/SignIn',
    data: {
      email: username,
      password,
    },
  });
  
  return response.access_token;
  },
}