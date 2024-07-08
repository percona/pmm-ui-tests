import { expect } from '@playwright/test';
import PortalUser from '@helpers/types/portal-user.class';
import constants from '@helpers/constants';
import axios, { AxiosResponse, Method } from 'axios';
import https from 'https';

/**
 * Implemented HTTP request to OKTA API using provided configuration.
 *
 * @param   method    HTTP request type {@link Method}
 * @param   apiPath   API v1 endpoint path, ex: "/users"
 * @param   payload   JSON {@code object}; an empty object for get or delete requests
 */
const oktaRequest = async (method: Method, apiPath: string, payload = {}): Promise<AxiosResponse> => {
  console.log(`${method.toUpperCase()}: ${constants.okta.url}/api/v1${apiPath}`);
  const response = await axios({
    url: `${constants.okta.url}/api/v1${apiPath}`,
    headers: { 'X-Requested-With': 'XMLHttpRequest', Authorization: constants.okta.token },
    method,
    data: payload,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  });
  expect(response.status, `Expected to be 200: ${response.status} ${response.statusText}`).toEqual(200);
  console.log(`Status: ${response.status} ${response.statusText}`);
  return response;
};

export const oktaApi = {
  async createUser(user: PortalUser, activate = true) {
    const data = {
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        login: user.email,
        marketing: true,
        tos: true,
      },
      credentials: { password: { value: user.password } },
    };
    return oktaRequest('post', `/users?activate=${activate}`, data);
  },

  async createTestUser(userEmail?: string): Promise<PortalUser> {
    const user = new PortalUser(userEmail);
    await this.createUser(user);
    return user;
  },

  async getUser(email: string): Promise<PortalUser> {
    const response = await oktaRequest('GET', `/users?q=${email}`);
    console.log(`Response is: ${JSON.stringify(response.data)}`);
    console.log(response.data[0].profile.email);
    console.log(response.data[0]);
    expect(response.data[0], `Found user must have email: ${response.data[0].profile}`).toHaveProperty('email', email);
    expect(response.data[0].profile.email, `Found user email must be: ${email}`).toEqual(email);
    return response.data[0] as PortalUser;
  },

  async getUserDetails(userId: string) {
    return oktaRequest('GET', `/users/${userId}`);
  },

  async getUserDetailsByEmail(userEmail: string) {
    const user = await this.getUser(userEmail);
    const response = await oktaRequest('GET', `/users/${user.id}`);

    expect(response.status).toEqual(200);

    return response;
  },

  async getUserId(user: PortalUser) {
    const response = await oktaRequest('POST', '/api/v1/authn', {
      password: user.password,
      username: user.email,
      options: { warnBeforePasswordExpired: true, multiOptionalFactorEnroll: false },
    });

    // eslint-disable-next-line no-underscore-dangle
    return response.data._embedded.user.id as number;
  },

  async deactivateUserById(userId: string) {
    return oktaRequest('DELETE', `/users/${userId}`);
  },

  async deleteUserById(userId: string) {
    await this.deactivateUserById(userId);
    await this.deactivateUserById(userId);
  },

  async deleteUserByEmail(email: string) {
    const userDetails = await this.getUser(email);

    if (userDetails.id) {
      await this.deleteUserById(userDetails.id);
    }
  },

  async deleteUserByEmailIfExists(userEmail: string) {
    if (await this.getUser(userEmail)) {
      await this.deleteUserByEmail(userEmail);
    }
  },

  async deleteUsers(users: PortalUser[]) {
    for await (const user of users) {
      await this.deleteUserByEmail(user.email);
    }
  },
};
