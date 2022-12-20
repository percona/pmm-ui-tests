const { I, dbaasPage } = inject();

module.exports = {
  loader: locate('$pmm-overlay-wrapper').find('//i[contains(@class,"fa-spinner")]'),
  operatorVersion: {
    // FIXME: expected pxc operator should be 1.11.0 after https://jira.percona.com/browse/PMM-11024 is fixed
    PXC: 'Percona Operator for MySQL 1.11.0',
    PSMDB: 'Percona Operator for MongoDB 1.11.0',
  },
  components: {
    PXC: {
      name: 'Percona Operator for MySQL',
      dataqa: 'pxcpxc',
    },
    PSMDB: {
      name: 'Percona Operator for MongoDB',
      dataqa: 'psmdbmongod',
    },
    HAPROXY: {
      name: 'HAProxy',
      dataqa: 'pxchaproxy',
    },
  },

  manageVersion: {
    cancelButton: '$kubernetes-components-versions-cancel',
    changeVersionSuccessMessage: 'Components versions updated successfully',
    component: '$kubernetes-component',
    componentSelector: (component) => I.getSingleSelectOptionLocator(component),
    defaultVersionSelector: '$kubernetes-default-version',
    defaultVersionOption: (version) => locate('$kubernetes-default-version-option').find('span').withText(version),
    dialogTitle: 'Manage Components Versions',
    defaultVersionSelectorFieldErrorMessage: '$select-field-error-message',
    errorMessageRequiredField: 'Required field',
    getVersionNumber: (component, position) => locate(`$${component}-options`)
      .find('//div/span[1]')
      .at(position),
    getVersionNumberLocator: (component) => locate(`$${component}-options`)
      .find('//div/span[1]'),
    getRecommendedVersionLocator: (component) => locate(`$${component}-options`)
      .find('span')
      .withText('Recommended')
      .find('//preceding-sibling::span'),
    modalHeader: '$modal-header',
    operatorSelector: (operatorName) => I.getSingleSelectOptionLocator(operatorName),
    operator: '$kubernetes-operator',
    saveButton: '$kubernetes-components-versions-save',
    versionCheckBox: (component, versionNumber) => locate(`$${component}-options`)
      .find('span')
      .withText(versionNumber)
      .find('//parent::div//label//span'),
    versionsSection: (component) => locate(`$${component}-options`)
      .find('//div[contains(@data-testid, "-option")]'),
    versionSelectorFieldErrorMessage: (component) => `$${component}-field-error-message`,
  },

  async getTotalSupportedVersions(component) {
    return await I.grabNumberOfVisibleElements(
      this.manageVersion.versionsSection(component),
    );
  },

  async getSupportedVersion(component, position) {
    return await I.grabTextFrom(this.manageVersion.getVersionNumber(component, position));
  },

  async getRecommendedVersion(component) {
    return await I.grabTextFrom(this.manageVersion.getRecommendedVersionLocator(component)
      .last());
  },

  async getAllVersionsSupported(component) {
    return await I.grabTextFromAll(this.manageVersion.getVersionNumberLocator(component));
  },

  async getAllRecommendedVersions(component) {
    return await I.grabTextFromAll(this.manageVersion.getRecommendedVersionLocator(component));
  },

  // Checkbox for version selector is a psuedo element, very difficult to track if checked or not
  async setVersions(component, versions) {
    versions.forEach((version) => {
      this.setSpecificVersion(component, version);
    });
  },

  async selectAllSupportedVersions(component) {
    const versions = await this.getAllVersionsSupported(component);

    versions.forEach((version) => {
      // only checks the version checkbox to unset/set it from default
      this.setSpecificVersion(component, version);
    });
  },

  setSpecificVersion(component, version) {
    I.forceClick(this.manageVersion.versionCheckBox(component, version));
  },

  async isRecommendedVersion(component, version) {
    const recommendedVersions = await I.grabTextFromAll(
      this.manageVersion.getRecommendedVersionLocator(component),
    );

    return recommendedVersions.includes(version);
  },

  async verifyAllVersionSupportedByDefault(component, count) {
    I.click(this.manageVersion.defaultVersionSelector);
    for (let i = 1; i <= count; i++) {
      const getVersionNumber = await this.getSupportedVersion(component, i);

      I.seeElement(this.manageVersion.defaultVersionOption(getVersionNumber));
    }
  },

  async waitForManageVersionPopup(clusterName) {
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.actionsLocator(clusterName), 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.actionsLocator(clusterName));
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.manageVersions, 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.manageVersions);
    I.waitForDetached(this.loader, 30);
  },

  async selectOperatorVersion(operatorVersion) {
    I.click(this.manageVersion.operator);
    I.waitForElement(
      this.manageVersion.operatorSelector(
        operatorVersion,
      ), 30,
    );
    I.forceClick(
      this.manageVersion.operatorSelector(
        operatorVersion,
      ),
    );
  },

  async selectComponent(componentName) {
    I.click(this.manageVersion.component);
    I.waitForElement(
      this.manageVersion.componentSelector(
        componentName,
      ), 30,
    );
    I.forceClick(
      this.manageVersion.componentSelector(
        componentName,
      ),
    );
  },

  async selectDefaultVersion(version) {
    I.waitForElement(
      this.manageVersion.defaultVersionOption(
        version,
      ), 30,
    );
    I.forceClick(
      this.manageVersion.defaultVersionOption(
        version,
      ),
    );
  },

};
