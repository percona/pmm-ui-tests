/// <reference types='codeceptjs' />
type steps_file = typeof import('./tests/custom_steps.js');
type codeceptjsConfig = typeof import('./pr.codecept.js');
type addInstanceAPI = typeof import('./tests/pages/api/addInstanceAPI.js');
type amiInstanceAPI = typeof import('./tests/pages/api/amiInstanceAPI.js');
type adminPage = typeof import('./tests/pages/adminPage.js');
type alertRulesPage = typeof import('./tests/ia/pages/alertRulesPage.js');
type alertmanagerAPI = typeof import('./tests/pages/api/alertmanagerAPI.js');
type alertsAPI = typeof import('./tests/ia/pages/api/alertsAPI.js');
type alertsPage = typeof import('./tests/ia/pages/alertsPage.js');
type allChecksPage = typeof import('./tests/stt/pages/allChecksPage.js');
type amiInstanceSetupPage = typeof import('./tests/pages/amiInstanceSetupPage.js');
type annotationAPI = typeof import('./tests/pages/api/annotationAPI.js');
type backupAPI = typeof import('./tests/backup/pages/api/backupAPI.js');
type backupInventoryPage = typeof import('./tests/backup/pages/inventoryPage.js');
type channelsAPI = typeof import('./tests/ia/pages/api/channelsAPI.js');
type dashboardPage = typeof import('./tests/pages/dashboardPage.js');
type databaseChecksPage = typeof import('./tests/stt/pages/databaseChecksPage.js');
type dbaasAPI = typeof import('./tests/DbaaS/api/dbaasAPI.js');
type dbaasPage = typeof import('./tests/DbaaS/pages/dbaasPage.js');
type dbaasActionsPage = typeof import('./tests/DbaaS/pages/dbaasActionsPage.js');
type dbaasManageVersionPage = typeof import('./tests/DbaaS/pages/dbaasManageVersionPage.js');
type grafanaAPI = typeof import('./tests/pages/api/grafanaAPI.js');
type homePage = typeof import('./tests/pages/homePage.js');
type inventoryAPI = typeof import('./tests/pages/api/inventoryAPI.js');
type mysqlTableDetailsPage = typeof import('./tests/pages/mysqlTableDetailsPage.js');
type links = typeof import('./linksHelper.js');
type locationsPage = typeof import('./tests/backup/pages/locationsPage.js');
type locationsAPI = typeof import('./tests/backup/pages/api/locationsAPI.js');
type ncPage = typeof import('./tests/ia/pages/notificationChannelsPage.js');
type perconaServerDB = typeof import('./tests/DbHelpers/perconaServerDB.js');
type pmmDemoPage = typeof import('./tests/pages/pmmDemoPage.js');
type pmmInventoryPage = typeof import('./tests/pages/pmmInventoryPage.js');
type pmmSettingsPage = typeof import('./tests/pages/pmmSettingsPage.js');
type qanDetails = typeof import('./tests/QAN/pages/qanDetailsFragment.js');
type qanFilters = typeof import('./tests/QAN/pages/qanFiltersFragment.js');
type qanOverview = typeof import('./tests/QAN/pages/qanOverviewFragment.js');
type qanPage = typeof import('./tests/QAN/pages/qanPage.js');
type qanPagination = typeof import('./tests/QAN/pages/qanPaginationFragment.js');
type remoteInstancesPage = typeof import('./tests/pages/remoteInstancesPage.js');
type remoteInstancesHelper = typeof import('./tests/remoteInstances/remoteInstancesHelper.js');
type restorePage = typeof import('./tests/backup/pages/restorePage.js');
type rulesAPI = typeof import('./tests/ia/pages/api/rulesAPI.js');
type ruleTemplatesPage = typeof import('./tests/ia/pages/ruleTemplatesPage.js');
type scheduledAPI = typeof import('./tests/backup/pages/api/scheduledAPI.js');
type scheduledPage = typeof import('./tests/backup/pages/scheduledPage.js');
type iaCommon = typeof import('./tests/ia/pages/iaCommonPage.js');
type platformAPI = typeof import('./tests/pages/api/platformAPI.js');
type securityChecksAPI = typeof import('./tests/stt/pages/api/securityChecksAPI.js');
type settingsAPI = typeof import('./tests/pages/api/settingsAPI.js');
type templatesAPI = typeof import('./tests/ia/pages/api/templatesAPI.js');
type MongoDBHelper = import('./tests/helper/mongoDB.js');
type Grafana = import('./tests/helper/grafana_helper.js');
type Mailosaur = import('codeceptjs-mailosaurhelper');
type DbHelper = import('codeceptjs-dbhelper');

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any, codeceptjsConfig: codeceptjsConfig, addInstanceAPI: addInstanceAPI, amiInstanceAPI: amiInstanceAPI, adminPage: adminPage, alertRulesPage: alertRulesPage, alertmanagerAPI: alertmanagerAPI, alertsAPI: alertsAPI, alertsPage: alertsPage, allChecksPage: allChecksPage, amiInstanceSetupPage: amiInstanceSetupPage, annotationAPI: annotationAPI, backupAPI: backupAPI, backupInventoryPage: backupInventoryPage, channelsAPI: channelsAPI, dashboardPage: dashboardPage, databaseChecksPage: databaseChecksPage, dbaasAPI: dbaasAPI, dbaasPage: dbaasPage, dbaasActionsPage: dbaasActionsPage, dbaasManageVersionPage: dbaasManageVersionPage, grafanaAPI: grafanaAPI, homePage: homePage, inventoryAPI: inventoryAPI, mysqlTableDetailsPage: mysqlTableDetailsPage, links: links, locationsPage: locationsPage, locationsAPI: locationsAPI, ncPage: ncPage, perconaServerDB: perconaServerDB, pmmDemoPage: pmmDemoPage, pmmInventoryPage: pmmInventoryPage, pmmSettingsPage: pmmSettingsPage, qanDetails: qanDetails, qanFilters: qanFilters, qanOverview: qanOverview, qanPage: qanPage, qanPagination: qanPagination, remoteInstancesPage: remoteInstancesPage, remoteInstancesHelper: remoteInstancesHelper, restorePage: restorePage, rulesAPI: rulesAPI, ruleTemplatesPage: ruleTemplatesPage, scheduledAPI: scheduledAPI, scheduledPage: scheduledPage, iaCommon: iaCommon, platformAPI: platformAPI, securityChecksAPI: securityChecksAPI, settingsAPI: settingsAPI, templatesAPI: templatesAPI }
  interface Methods extends Playwright, MongoDBHelper, Grafana, REST, Mailosaur, DbHelper {}
  interface I extends ReturnType<steps_file>, WithTranslation<MongoDBHelper>, WithTranslation<Grafana>, WithTranslation<Mailosaur>, WithTranslation<DbHelper> {}
  namespace Translation {
    interface Actions {}
  }
}
