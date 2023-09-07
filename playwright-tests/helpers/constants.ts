/**
 * Constants collection to keep in a single place.
 * Main function is to handle process.env usage in a single file.
 */
const constants = {
  serviceNow: {
    username: process.env.SERVICENOW_LOGIN || '',
    password: process.env.SERVICENOW_PASSWORD || '',
    devUrl: process.env.SERVICENOW_DEV_URL || '',
  },
  okta: {
    url: `https://${process.env.OAUTH_DEV_HOST}`,
    issuerUrl: process.env.OAUTH_ISSUER_URL || '',
    token: `SSWS ${process.env.OKTA_TOKEN}`,
  },
  portal: {
    url: process.env.PORTAL_BASE_URL || 'https://portal-dev.percona.com',
    credentialsFile: 'portalCredentials',
  },
};

export default constants;
