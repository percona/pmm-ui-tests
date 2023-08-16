import { expect, Page } from '@playwright/test';
import config from '@tests/playwright.config';
import { PortalUser } from '@helpers/types/PortalUser';
import * as dotenv from 'dotenv';
import { Constants } from '@helpers/Constants';
import axios, { AxiosResponse, Method } from 'axios';
import https from 'https';

dotenv.config();
const portalUrl = config.use!.baseURL!;

/**
 * Implemented HTTP request to OKTA API using provided configuration.
 *
 * @param   method    HTTP request type {@link Method}
 * @param   apiPath   API v1 endpoint path, ex: "/users"
 * @param   payload   JSON {@code object}; an empty object for get or delete requests
 */
const oktaRequest = async (method: Method, apiPath: string, payload = {}): Promise<AxiosResponse> => {
  console.log(`${method.toUpperCase()}: ${Constants.okta.url}/api/v1${apiPath}\nPayload: ${JSON.stringify(payload)}`);
  const response = await axios({
    url: `${Constants.okta.url}/api/v1${apiPath}`,
    headers: { 'X-Requested-With': 'XMLHttpRequest', Authorization: Constants.okta.token },
    method,
    data: payload,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  });
  expect(response.status, `Expected to be 200: ${response.status} ${response.statusText}`).toEqual(200);
  console.log(`Status: ${response.status} ${response.statusText}`);
  return response;
};

export const okta = {
  async loginByOktaApi(user: PortalUser, page: Page) {
    const credentials = {
      username: user.email,
      password: user.password,
    };
    const response = await oktaRequest('post', '/authn', credentials);
    const authConfig = {
      baseUrl: Constants.okta.url,
      clientId: process.env.REACT_APP_OAUTH_DEV_CLIENT_ID,
      redirectUri: `${portalUrl}/login/callback`,
      issuer: process.env.REACT_APP_OAUTH_DEV_ISSUER_URI,
      features: {
        registration: true,
        rememberMe: true,
        idpDiscovery: true,
      },
      authParams: {
        pkce: true,
      },
      scopes: ['openid', 'profile', 'email', 'percona'],
      postLogoutRedirectUri: portalUrl,
      idpDiscovery: {
        requestContext: `${portalUrl}/login/callback`,
      },
      idps: [
        { type: 'GOOGLE', id: process.env.REACT_APP_DEV_GOOGLE_IDP_ID },
        { type: 'GITHUB', id: process.env.REACT_APP_DEV_GITHUB_IDP_ID },
      ],
    };

    await page.addScriptTag({
      path: './node_modules/@okta/okta-auth-js/dist/okta-auth-js.min.js',
    });

    await page.evaluate(
      // eslint-disable-next-line @typescript-eslint/no-shadow
      async ({ authConfig, response }) => {
        // @ts-ignore
        const authClient = new window.OktaAuth(authConfig);
        const { tokens } = await authClient.token.getWithoutPrompt({
          sessionToken: response.data.sessionToken,
        });

        const userToken = { accessToken: tokens.accessToken, idToken: tokens.idToken };

        localStorage.setItem('okta-token-storage', JSON.stringify(userToken));
      },
      { authConfig, response },
    );
    await page.reload();
  },

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
      credentials: {
        password: { value: user.password },
      },
    };
    return oktaRequest('post', `/users?activate=${activate}`, data);
  },

  async createTestUser(userEmail?: string): Promise<PortalUser> {
    const user = new PortalUser(userEmail);
    await this.createUser(user);
    return user;
  },

  async createUserWithoutMarketingConsent(user: PortalUser, activate = true) {
    const data = {
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        login: user.email,
      },
      credentials: {
        password: { value: user.password },
      },
    };
    return oktaRequest('post', `/users?activate=${activate}`, data);
  },

  async getUser(email: string): Promise<PortalUser> {
    const response = await oktaRequest('GET', `/users?q=${email}`);
    expect(response.data[0], `Found user must have email: ${response.data[0]}`).toHaveProperty(email);
    expect(response.data[0].email, `Found user email must be: ${email}`).toEqual(email);
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

  async getUserInfo(userToken: string) {
    console.log(`GET: ${Constants.okta.issuerUrl}/v1/userinfo`);
    const response = await axios({
      url: `${Constants.okta.issuerUrl}/v1/userinfo`,
      headers: { 'X-Requested-With': 'XMLHttpRequest', Authorization: `Bearer ${userToken}` },
      method: 'GET',
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    expect(response.status, `Expected to be 200: ${response.status} ${response.statusText}`).toEqual(200);
    console.log(`Status: ${response.status} ${response.statusText}`);
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
    // eslint-disable-next-line no-restricted-syntax
    for await (const user of users) {
      await this.deleteUserByEmail(user.email);
    }
  },
};
