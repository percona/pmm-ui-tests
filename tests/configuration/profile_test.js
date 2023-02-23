/**
 * Note!
 * All tests with changing password must use UI login: {@code loginPage.login();}
 * to keep logout, re-login and restore admin password working.
 */

Feature('PMM User Profile tests');

const NEW_ADMIN_PASSWORD = 'admin1';

After(async ({ I, profileAPI }) => {
  await tryTo(() => {
    I.Authorize('admin', NEW_ADMIN_PASSWORD);
    profileAPI.changePassword('admin', NEW_ADMIN_PASSWORD, process.env.ADMIN_PASSWORD);
  });
});

Scenario(
  'PMM-T1559 Verify clients still can connect to PMM server after password\'s changing @user-password',
  async ({
    I, changePasswordPage, loginPage, pmmInventoryPage,
  }) => {
    await I.amOnPage(loginPage.url);
    loginPage.login();
    await changePasswordPage.open();
    changePasswordPage.fillChangePasswordForm(process.env.ADMIN_PASSWORD, NEW_ADMIN_PASSWORD);
    changePasswordPage.applyChanges();
    I.signOut();
    await I.waitForVisible(loginPage.fields.loginInput, 30);
    await I.Authorize('admin', NEW_ADMIN_PASSWORD);

    await I.say('Verify all agents have "Running" status. There is no agent with "DONE" and "UNKNOWN" status');
    await pmmInventoryPage.agentsTab.open();
    await pmmInventoryPage.agentsTab.pagination.selectRowsPerPage(100);

    // TODO: improve inventoryAPI.apiGetServices() to handle flexible auth.
    const resp = await I.sendPostRequest('v1/inventory/Services/List', {},
      { Authorization: `Basic ${await I.getAuth('admin', NEW_ADMIN_PASSWORD)}` });
    const services = Object.values(resp.data).flat(Infinity).map((o) => ({ id: o.service_id, name: o.service_name }));

    for (const service of services) {
      await pmmInventoryPage.agentsTab.verifyAgentOtherDetailsSection('status:', 'status: RUNNING', service.name, service.id);
    }

    // TODO: refactor grafanaAPI.getMetric() to have time range argument, add sleep 5 sec and get metrics for last 5 sec
    // Verify metrics exists: useless with current hardcoded time range
    // await grafanaAPI.checkMetricExist('pg_stat_activity_count', null);
    // await grafanaAPI.checkMetricExist('mysql_global_status_threads_connected', null);
    // await grafanaAPI.checkMetricExist('mongodb_mongod_op_counters_total', null);
    // await grafanaAPI.checkMetricExist('node_cpu_seconds_total', null);
  },
);
