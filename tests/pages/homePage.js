const { I, dashboardPage } = inject();
const assert = require('assert');
// The original regex source is https://regexlib.com/REDetails.aspx?regexp_id=5055
// eslint-disable-next-line no-useless-escape
const lastCheckRegex = /^(?:(((Jan(uary)?|Ma(r(ch)?|y)|Jul(y)?|Aug(ust)?|Oct(ober)?|Dec(ember)?)\ 31)|((Jan(uary)?|Ma(r(ch)?|y)|Apr(il)?|Ju((ly?)|(ne?))|Aug(ust)?|Oct(ober)?|(Sept|Nov|Dec)(ember)?) (0?[1-9]|([12]\d)|30))|(Feb(ruary)? (0?[1-9]|1\d|2[0-8]|(29(?=, ))))),) (?:[0-1]?[0-9]|[2][1-4]):[0-5]?[0-9]?\s??$/gim;

module.exports = {
  // insert your locators and methods here
  // setting locators
  url: 'graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m&from=now-5m&to=now',
  landingUrl: 'graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m',
  genericOauthUrl: 'graph/login/generic_oauth',
  landingPage: 'graph/login',
  requestEnd: '/v1/Updates/Check',
  fields: {
    systemsUnderMonitoringCount:
      locate('.panel-content span').inside('[aria-label="Monitored nodes panel"]'),
    dbUnderMonitoringCount:
      locate('.panel-content span').inside('[aria-label="Monitored DB Services panel"]'),
    dashboardHeaderText: 'Percona Monitoring and Management',
    dashboardHeaderLocator: '//div[contains(@class, "dashboard-header")]',
    oldLastCheckSelector: '#pmm-update-widget > .last-check-wrapper p',
    sttDisabledFailedChecksPanelSelector: '$db-check-panel-settings-link',
    failedSecurityChecksPmmSettingsLink: locate('$db-check-panel-settings-link').find('a'),
    sttFailedChecksPanelSelector: '$db-check-panel-has-checks',
    checksPanelSelector: '$db-check-panel-home',
    noFailedChecksInPanel: '$db-check-panel-zero-checks',
    failedChecksPanelInfo: '[aria-label="Failed Checks panel"] i',
    newsPanelTitleSelector: dashboardPage.graphsLocator('Percona News'),
    pmmCustomMenu: locate('$navbar-section').find('.dropdown a[aria-label="PMM dashboards"]'),
    servicesButton: locate('span').withText('Services'),
    newsPanelContentSelector:
      locate('.panel-content').inside('[aria-label="Percona News panel"]'),
    popUp: '.popper__background',
    noAccessRightsSelector: '$unauthorized',
    updateWidget: {
      base: {
        checkUpdateButton: '#refresh',
        updateProgressModal: '.modal-content',
        successUpgradeMsgSelector: '.modal-content',
        lastCheckSelector: '.last-check-wrapper > p',
        triggerUpdate: 'button[ng-click="update()"]',
        reloadButtonAfterUpgrade: 'button[ng-click="reloadAfterUpdate()"]',
        upToDateLocator: '//div[@class="panel-content"]//section/p[text()="You are up to date"]',
        availableVersion: '#available_version > div > p',
        currentVersion: '#current_version > span',
        inProgressMessage: 'Update in progress',
        successUpgradeMessage: 'Successfully updated',
        whatsNewLink: 'a.text-primary.pmm-link',
      },
      oldDataAttr: {
        checkUpdateButton: '[data-qa="update-last-check-button"]',
        currentVersion: '[data-qa="update-installed-version"]',
        lastCheckSelector: '[data-qa="update-last-check"]',
        triggerUpdate: '//button//span[contains(text(), "Upgrade to")]',
        updateProgressModal: '//div/h4[text()="Upgrade in progress"]',
        successUpgradeMsgSelector: '[data-qa="modal-update-success-text"]',
        reloadButtonAfterUpgrade: '[data-qa="modal-close"]',
        availableVersion: '[data-qa="update-latest-version"]',
        inProgressMessage: 'Upgrade in progress',
        successUpgradeMessage: 'PMM has been successfully upgraded to version',
        whatsNewLink: '//a[@rel="noreferrer"]',
      },
      latest: {
        checkUpdateButton: '$update-last-check-button',
        currentVersion: '$update-installed-version',
        lastCheckSelector: '$update-last-check',
        triggerUpdate: '//button//span[contains(text(), "Upgrade to")]',
        updateProgressModal: '//div/h4[text()="Upgrade in progress"]',
        successUpgradeMsgSelector: '$modal-update-success-text',
        reloadButtonAfterUpgrade: '$modal-close',
        availableVersion: '$update-latest-version',
        inProgressMessage: 'Upgrade in progress',
        successUpgradeMessage: 'PMM has been successfully upgraded to version',
        whatsNewLink: '//a[@rel="noreferrer"]',
      },
    },
  },
  upgradeMilestones: [
    'TASK [Gathering Facts]',
    'TASK [dashboards_upgrade : Copy file with image version]',
    'TASK [Delete content & directory]',
    'failed=0',
  ],
  failedChecksSinglestatsInfoMessage: 'Display the number of Advisors checks identified as failed during its most recent run.',

  serviceDashboardLocator: (serviceName) => locate('a').withText(serviceName),
  isAmiUpgrade: process.env.AMI_UPGRADE_TESTING_INSTANCE === 'true',
  pmmServerName: process.env.VM_NAME ? process.env.VM_NAME : 'pmm-server',

  async open() {
    I.amOnPage(this.url);
    I.waitForElement(this.fields.dashboardHeaderLocator, 60);
  },

  // introducing methods
  async upgradePMM(version) {
    let locators = this.getLocators(version);
    const milestones = this.upgradeMilestones;

    I.waitForElement(locators.triggerUpdate, 180);
    I.seeElement(locators.triggerUpdate);
    const available_version = await I.grabTextFrom(locators.availableVersion);

    I.click(locators.triggerUpdate);
    I.waitForElement(locators.updateProgressModal, 30);
    I.waitForText(locators.inProgressMessage, 30, locators.updateProgressModal);

    // skipping milestones checks for 2.9 and 2.10, 2.11 versions due logs not showing issue
    if (version > 11) {
      if (this.isAmiUpgrade) {
        // to ensure that the logs window is never empty during upgrade
        I.waitForElement(`//pre[contains(text(), '${milestones[0]}')]`, 1200);

        I.waitForText(locators.successUpgradeMessage, 1200, locators.successUpgradeMsgSelector);
      }

      if (!this.isAmiUpgrade) {
        // to ensure that the logs window is never empty during upgrade
        I.waitForElement(`//pre[contains(text(), '${milestones[0]}')]`, 1200);
        I.waitForText(locators.successUpgradeMessage, 1200, locators.successUpgradeMsgSelector);

        // Get upgrade logs from a container
        const upgradeLogs = await I.verifyCommand(`docker exec ${this.pmmServerName} cat /srv/logs/pmm-update-perform.log`);

        milestones.forEach((milestone) => {
          assert.ok(upgradeLogs.includes(milestone), `Expected to see ${milestone} in upgrade logs`);
        });
      }

      I.click(locators.reloadButtonAfterUpgrade);
    } else {
      I.waitForText(locators.successUpgradeMessage, 1200, locators.successUpgradeMsgSelector);
      // we have a bug we need this https://jira.percona.com/browse/PMM-9294
      I.wait(60);

      I.click(locators.reloadButtonAfterUpgrade);
      I.refreshPage();
    }

    locators = this.getLocators('latest');

    I.waitForVisible(locators.upToDateLocator, 60);
    assert.equal(
      await I.grabTextFrom(locators.currentVersion),
      available_version.split(' ')[0],
      'Upgrade operation failed',
    );
  },

  async verifyPreUpdateWidgetIsPresent(version) {
    const locators = this.getLocators(version);

    I.waitForVisible(locators.triggerUpdate, 180);
    I.waitForVisible(locators.currentVersion, 180);
    I.seeElement(locators.availableVersion);
    I.seeElement(locators.currentVersion);
    I.seeElement(locators.triggerUpdate);
    I.dontSeeElement(locators.upToDateLocator);
    I.seeElement(locators.currentVersion);
    I.seeElement(locators.checkUpdateButton);
    I.see('Last check:');
    assert.notEqual(
      await I.grabTextFrom(locators.availableVersion),
      await I.grabTextFrom(locators.currentVersion),
      'Available and Current versions match',
    );
  },

  async verifyPostUpdateWidgetIsPresent() {
    const locators = this.getLocators('latest');

    I.waitForVisible(locators.upToDateLocator, 60);
    I.waitForVisible(locators.lastCheckSelector, 30);
    I.dontSeeElement(locators.availableVersion);
    I.dontSeeElement(locators.triggerUpdate);
    I.seeElement(locators.upToDateLocator);
    I.seeElement(locators.currentVersion);
    I.seeElement(locators.checkUpdateButton);
    const date = await I.grabTextFrom(locators.lastCheckSelector);

    assert.ok(lastCheckRegex.test(date), `Last Check Date has unexpected pattern: ${date}`);
  },

  verifyVisibleService(serviceName) {
    const serviceExists = locate('.react-grid-item').find(locate('p').withText(serviceName));

    I.waitForElement(serviceExists, 30);
    I.seeElement(serviceExists);
  },

  // Method used to get selectors for different PMM versions, only to change locators after 2.9 version update
  getLocators(version) {
    let locators;

    // data-testid introduction since 2.23
    if (version >= 9 && version <= 22) {
      // eslint-disable-next-line no-param-reassign
      version = 'oldDataAttr';
    } else {
      // eslint-disable-next-line no-param-reassign
      version = 'latest';
    }

    version in this.fields.updateWidget
      ? (locators = {
        ...this.fields.updateWidget.base,
        ...this.fields.updateWidget[version],
      })
      : (locators = this.fields.updateWidget.base);

    return locators;
  },

  // For running on local env set PMM_SERVER_LATEST and DOCKER_VERSION variables
  getVersions() {
    const [, pmmMinor, pmmPatch] = (process.env.PMM_SERVER_LATEST || '').split('.');
    const [, versionMinor, versionPatch] = process.env.DOCKER_VERSION
      ? (process.env.DOCKER_VERSION || '').split('.')
      : (process.env.SERVER_VERSION || '').split('.');

    const majorVersionDiff = pmmMinor - versionMinor;
    const patchVersionDiff = pmmPatch - versionPatch;
    const current = `2.${versionMinor}`;

    return {
      majorVersionDiff,
      patchVersionDiff,
      current,
      versionMinor,
    };
  },
};
