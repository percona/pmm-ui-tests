import { expect, Page } from '@playwright/test';
import { getUser } from '../helpers/portalHelper';
import config from '../playwright.config';
import User from '../support/types/user.interface';
import { oktaRequest } from './helpers/oktaApiHelper';
import * as dotenv from 'dotenv';

dotenv.config();

const oktaUrl = `https://${process.env.OAUTH_DEV_HOST}`;
const oktaIssuerUrl = process.env.REACT_APP_OAUTH_DEV_ISSUER_URI ? process.env.REACT_APP_OAUTH_DEV_ISSUER_URI : '';
const oktaToken = `SSWS ${process.env.OKTA_TOKEN}`;
const portalUrl = config.use!.baseURL!;

export const oktaAPI = {
  async loginByOktaApi(user: User, page: Page) {
    const credentials = {
      username: user.email,
      password: user.password,
    };
    const response = await oktaRequest(oktaUrl, '/api/v1/authn', 'post', oktaToken, credentials);
    const authConfig = {
      baseUrl: oktaUrl,
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

  async createUser(user: User, activate = true) {
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

    const response = await oktaRequest(
      oktaUrl,
      `/api/v1/users?activate=${activate}`,
      'post',
      oktaToken,
      data,
    );

    expect(response.status).toEqual(200);

    return response;
  },

  async createTestUser(userEmail?: string): Promise<User> {
    const user = getUser(userEmail);

    await this.createUser(user);

    return user;
  },

  async createUserWithoutMarketingConsent(user: User, activate = true) {
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

    const response = await oktaRequest(
      oktaUrl,
      `/api/v1/users?activate=${activate}`,
      'post',
      oktaToken,
      data,
    );

    expect(response.status).toEqual(200);

    return response;
  },

  async getUser(email: string) {
    const response = await oktaRequest(oktaUrl, `/api/v1/users?q=${email}`, 'GET', oktaToken, {});

    expect(response.status).toEqual(200);

    return response.data[0];
  },

  async getUserDetails(userId: string) {
    const response = await oktaRequest(oktaUrl, `/api/v1/users/${userId}`, 'GET', oktaToken, {});

    expect(response.status).toEqual(200);

    return response;
  },

  async getUserDetailsByEmail(userEmail: string) {
    const user = await this.getUser(userEmail);
    const response = await oktaRequest(oktaUrl, `/api/v1/users/${user.id}`, 'GET', oktaToken, {});

    expect(response.status).toEqual(200);

    return response;
  },

  async getUserInfo(userToken: string) {
    const response = await oktaRequest(oktaIssuerUrl, '/v1/userinfo', 'GET', `Bearer ${userToken}`, {});

    expect(response.status).toEqual(200);

    return response;
  },

  async getUserId(user: User) {
    const response = await oktaRequest(oktaUrl, '/api/v1/authn', 'POST', oktaToken, {
      password: 'Test12345!',
      username: 'peter.sirotnak@3pillarglobal.com',
      options: { warnBeforePasswordExpired: true, multiOptionalFactorEnroll: false },
    });

    // eslint-disable-next-line no-underscore-dangle
    return response.data._embedded.user.id;
  },

  async deactivateUserById(userId: string) {
    return oktaRequest(oktaUrl, `/api/v1/users/${userId}`, 'DELETE', oktaToken, {});
  },

  async deleteUserById(userId: string) {
    await this.deactivateUserById(userId);
    await this.deactivateUserById(userId);
  },

  async deleteUserByEmail(email: string) {
    const userDetails = await this.getUser(email);

    if (userDetails.id) {
      const userId = userDetails.id;

      await this.deleteUserById(userId);
    }
  },

  async deleteUserByEmailIfExists(userEmail: string) {
    if (await this.getUser(userEmail)) {
      await this.deleteUserByEmail(userEmail);
    }
  },

  async deleteUsers(users: User[]) {
    // eslint-disable-next-line no-restricted-syntax
    for await (const email of users) {
      await this.deleteUserByEmail(email.email);
    }
  },
};
