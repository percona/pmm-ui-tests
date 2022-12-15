module.exports = {
  pageObjects: {
    I: './tests/custom_steps.js',
    codeceptjsConfig: './pr.codecept.js',
    credentials: './tests/pages/credentials.js',
    addInstanceAPI: './tests/pages/api/addInstanceAPI.js',
    addInstancePage: './tests/pages/addInstancePage.js',
    amiInstanceAPI: './tests/pages/api/amiInstanceAPI.js',
    adminPage: './tests/pages/adminPage.js',
    alertRulesPage: './tests/ia/pages/alertRulesPage.js',
    alertmanagerAPI: './tests/pages/api/alertmanagerAPI.js',
    alertsAPI: './tests/ia/pages/api/alertsAPI.js',
    alertsPage: './tests/ia/pages/alertsPage.js',
    allChecksPage: './tests/advisers/stt/pages/allChecksPage.js',
    amiInstanceSetupPage: './tests/pages/amiInstanceSetupPage.js',
    annotationAPI: './tests/pages/api/annotationAPI.js',
    backupAPI: './tests/backup/pages/api/backupAPI.js',
    backupInventoryPage: './tests/backup/pages/inventoryPage.js',
    channelsAPI: './tests/ia/pages/api/channelsAPI.js',
    contactPointsAPI: './tests/ia/pages/api/contactPointsAPI.js',
    dashboardPage: './tests/pages/dashboardPage.js',
    databaseChecksPage: './tests/advisers/stt/pages/databaseChecksPage.js',
    dbaasAPI: './tests/DbaaS/api/dbaasAPI.js',
    dbaasPage: './tests/DbaaS/pages/dbaasPage.js',
    dbaasActionsPage: './tests/DbaaS/pages/dbaasActionsPage.js',
    dbaasManageVersionPage: './tests/DbaaS/pages/dbaasManageVersionPage.js',
    explorePage: './tests/pages/explorePage.js',
    experimentalPostgresqlDashboardsPage: './tests/PageObjects/Dashboards/Postgresql/ExperimentalPostgresqlDashboards.js',
    grafanaAPI: './tests/pages/api/grafanaAPI.js',
    homePage: './tests/pages/homePage.js',
    inventoryAPI: './tests/pages/api/inventoryAPI.js',
    mysqlTableDetailsPage: './tests/pages/mysqlTableDetailsPage.js',
    leftNavMenu: './tests/pages/leftNavMenu.js',
    links: './tests/helper/linksHelper.js',
    locationsPage: './tests/backup/pages/locationsPage.js',
    locationsAPI: './tests/backup/pages/api/locationsAPI.js',
    ncPage: './tests/ia/pages/notificationChannelsPage.js',
    psMySql: './tests/helper/psMySql.js',
    organizationEntitlementsPage: './tests/pages/organizationEntitlementsPage.js',
    organizationTicketsPage: './tests/pages/organizationTicketsPage.js',
    perconaPlatformPage: './tests/pages/perconaPlatformPage/perconaPlatformPage.js',
    pmmDemoPage: './tests/pages/pmmDemoPage.js',
    pmmInventoryPage: './tests/configuration/pages/pmmInventoryPage.js',
    pmmServerAdminSettingsPage: './tests/configuration/pages/pmmServerAdminSettingsPage.js',
    pmmSettingsPage: './tests/configuration/pages/pmmSettingsPage.js',
    portalAPI: './tests/pages/api/portalAPI.js',
    qanDetails: './tests/QAN/pages/qanDetailsFragment.js',
    qanFilters: './tests/QAN/pages/qanFiltersFragment.js',
    qanOverview: './tests/QAN/pages/qanOverviewFragment.js',
    qanPage: './tests/QAN/pages/qanPage.js',
    qanPagination: './tests/QAN/pages/qanPaginationFragment.js',
    remoteInstancesPage: './tests/pages/remoteInstancesPage.js',
    remoteInstancesHelper: './tests/remoteInstances/remoteInstancesHelper.js',
    restorePage: './tests/backup/pages/restorePage.js',
    rulesAPI: './tests/ia/pages/api/rulesAPI.js',
    ruleTemplatesPage: './tests/ia/pages/ruleTemplatesPage.js',
    scheduledAPI: './tests/backup/pages/api/scheduledAPI.js',
    scheduledPage: './tests/backup/pages/scheduledPage.js',
    searchDashboardsModal: './tests/dashboards/pages/searchDashboardsModal.js',
    iaCommon: './tests/ia/pages/iaCommonPage.js',
    platformAPI: './tests/pages/api/platformAPI.js',
    securityChecksAPI: './tests/advisers/stt/pages/api/securityChecksAPI.js',
    settingsAPI: './tests/pages/api/settingsAPI.js',
    templatesAPI: './tests/ia/pages/api/templatesAPI.js',
    qanAPI: './tests/QAN/api/qanAPI.js',
    environmentOverviewPage: './tests/pages/environmentOverviewPage.js',
    tooltips: './tests/helper/tooltipHelper.js',
    stastsAndLicensePage: './tests/server-admin/pages/stastsAndLicensePage.js',
    dataSourcePage: './tests/pages/pmmSettingsPages/dataSourcePage.js',
    pmmTourPage: './tests/pages/pmmTourPage.js',
    loginPage: './tests/pages/loginPage.js',
  },
  getChunks: (files) => {
    const dependentTests = files.filter((value) => /PMMSettings|ia|stt|backup|permissions|Azure/.test(value));
    const dbaasTests = files.filter((value) => /DbaaS|TLSMongo/.test(value));
    const portalTests = files.filter((value) => /portal/.test(value));
    const otherTests = files.filter((val) => !dependentTests.includes(val)
      && !dbaasTests.includes(val) && !portalTests.includes(val));

    return [
      dependentTests,
      portalTests,
      otherTests,
      dbaasTests,
    ];
  },
};
