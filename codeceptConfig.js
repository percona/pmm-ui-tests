/* eslint-disable padding-line-between-statements */
const _ = require("lodash");
module.exports = {
  pageObjects: {
    I: './tests/custom_steps.js',
    codeceptjsConfig: './pr.codecept.js',
    addInstanceAPI: './tests/pages/api/addInstanceAPI.js',
    amiInstanceAPI: './tests/pages/api/amiInstanceAPI.js',
    adminPage: './tests/pages/adminPage.js',
    alertRulesPage: './tests/ia/pages/alertRulesPage.js',
    alertmanagerAPI: './tests/pages/api/alertmanagerAPI.js',
    alertsAPI: './tests/ia/pages/api/alertsAPI.js',
    alertsPage: './tests/ia/pages/alertsPage.js',
    allChecksPage: './tests/stt/pages/allChecksPage.js',
    amiInstanceSetupPage: './tests/pages/amiInstanceSetupPage.js',
    annotationAPI: './tests/pages/api/annotationAPI.js',
    backupAPI: './tests/backup/pages/api/backupAPI.js',
    backupInventoryPage: './tests/backup/pages/inventoryPage.js',
    channelsAPI: './tests/ia/pages/api/channelsAPI.js',
    dashboardPage: './tests/pages/dashboardPage.js',
    databaseChecksPage: './tests/stt/pages/databaseChecksPage.js',
    dbaasAPI: './tests/DbaaS/api/dbaasAPI.js',
    dbaasPage: './tests/DbaaS/pages/dbaasPage.js',
    dbaasActionsPage: './tests/DbaaS/pages/dbaasActionsPage.js',
    dbaasManageVersionPage: './tests/DbaaS/pages/dbaasManageVersionPage.js',
    grafanaAPI: './tests/pages/api/grafanaAPI.js',
    homePage: './tests/pages/homePage.js',
    inventoryAPI: './tests/pages/api/inventoryAPI.js',
    mysqlTableDetailsPage: './tests/pages/mysqlTableDetailsPage.js',
    links: './linksHelper.js',
    locationsPage: './tests/backup/pages/locationsPage.js',
    locationsAPI: './tests/backup/pages/api/locationsAPI.js',
    ncPage: './tests/ia/pages/notificationChannelsPage.js',
    perconaServerDB: './tests/DbHelpers/perconaServerDB.js',
    pmmDemoPage: './tests/pages/pmmDemoPage.js',
    pmmInventoryPage: './tests/pages/pmmInventoryPage.js',
    pmmSettingsPage: './tests/pages/pmmSettingsPage.js',
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
    iaCommon: './tests/ia/pages/iaCommonPage.js',
    platformAPI: './tests/pages/api/platformAPI.js',
    securityChecksAPI: './tests/stt/pages/api/securityChecksAPI.js',
    settingsAPI: './tests/pages/api/settingsAPI.js',
    templatesAPI: './tests/ia/pages/api/templatesAPI.js',
  },
  getChunks: (files) => {
    const take = (regexp) => {
      const next = files.filter((value) => regexp.test(value));
      // eslint-disable-next-line no-param-reassign
      files = files.filter((v) => !next.includes(v));
      return next;
    };

    const _ = require('lodash');
    const splitIntoParts = (items, parts) => _.chunk(items, items.length / parts);

    return [
      ...splitIntoParts(take(/\/ia\//), 2),
      take(/\/backup\//),
      take(/PMMSettings/),
      take(/\/DbaaS\//),
      files,
    ];
  },
};
