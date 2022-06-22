const { I } = inject();
module.exports = {
    url: 'graph/admin/upgrading',
    headLine: 'Instance statistics',
    fields: {
        enterpriseLicense: locate('h2').withText('Enterprise license'),
        grafanaEnterpriseLogo: locate('h2').withText('Grafana Enterprise'),
        freeTrial: locate('h3').withText('Get your free trial'),
        dataSourcePermission: locate('div').withText('Data source permissions'),
        reporting: locate('div').withText('Reporting'),
        saml: locate('div').withText('SAML authentication'),
        teamSync: locate('div').withText('Team Sync'),
        whiteLabeling: locate('div').withText('White labeling'),
        auditing: locate('div').withText('Auditing'),
        grafanaUsageInsights: locate('div').withText('Grafana usage insights'),
        sortDashByPop: locate('div').withText('Sort dashboards by popularity in search'),
        findUnusedDash: locate('div').withText('Find unused dashboards'),
        dashboardUsageStatsDrawer: locate('div').withText('Dashboard usage stats drawer'),
        enterprisePlugins: locate('div').withText('Enterprise plugins'),
        oracle: locate('div').withText('Oracle'),
        splunk: locate('div').withText('Splunk'),
        serviceNow: locate('div').withText('Service Now'),
        dynaTrace: locate('div').withText('Dynatrace'),
        newRelic: locate('div').withText('New Relic'),
        dataDog: locate('div').withText('DataDog'),
        appDynamics: locate('div').withText('AppDynamics'),
        sapHana: locate('div').withText('SAP HANA®'),
        honeycomb: locate('div').withText('Honeycomb'),
        jira: locate('div').withText('Jira'),
        mongoDb: locate('div').withText('MongoDB'),
        salesForce: locate('div').withText('Salesforce'),
        snowflake: locate('div').withText('Snowflake'),
        waveFront: locate('div').withText('Wavefront'),
        atYourService: locate('h4').withText('At your service'),
        Enterpriseplugins: locate('h4').withText('Enterprise Plugins'),
        criticalSla: locate('div').withText('At your service'),
        unlimitedExpert: locate('div').withText('Unlimited Expert Support'),
        email: locate('div').withText('Email'),
        slack: locate('div').withText('Private Slack channel'),
        phone: locate('div').withText('At your Phone'),
        handInHand: locate('div').withText('Hand-in-hand support'),

        
        
    },
    buttons: {
        contactUs: locate('span').withText('Contact us and get a free trial'),
    },
    openStatsAndLicensePage() {
      I.amOnPage(this.url);
    },
  };