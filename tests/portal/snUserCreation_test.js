Feature('Create Credentials for Service Now Users');

Scenario(
  'Prepare credentials for PMM-Portal @service-now-users',
  async ({
    I, portalAPI,
  }) => {
    const portalCredentials = await portalAPI.createServiceNowUsers();

    await portalAPI.oktaCreateUser(portalCredentials.admin1);
    await portalAPI.oktaCreateUser(portalCredentials.admin2);
    await portalAPI.oktaCreateUser(portalCredentials.technical);
    const adminToken = await portalAPI.getUserAccessToken(portalCredentials.admin1.email, portalCredentials.admin1.password);
    const org = await portalAPI.apiCreateOrg(adminToken);

    await portalAPI.apiInviteOrgMember(adminToken, org.id, { username: portalCredentials.admin2.email, role: 'Admin' });
    await portalAPI.apiInviteOrgMember(adminToken, org.id, { username: portalCredentials.technical.email, role: 'Technical' });

    process.env.ServiceNowAdminUsername = portalCredentials.admin1.email;
  },
);
