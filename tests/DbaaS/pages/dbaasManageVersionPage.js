const { I, dbaasPage } = inject();

module.exports = {
  loader: locate('$pmm-overlay-wrapper').find('//i[contains(@class,"fa-spinner")]'),
  operatorVersion: {
    PXC: 'PXC 1.8.0',
    PSMDB: 'PSMDB 1.7.0',
  },
  components: {
    PXC: {
      name: 'PXC',
      dataqa: 'xtradbpxc',
    },
    PSMDB: {
      name: 'PSMDB',
      dataqa: 'psmdbmongod',
    },
    HAPROXY: {
      name: 'HAProxy',
      dataqa: 'xtradbhaproxy',
    },
  },

  manageVersion: {
    cancelButton: '$kubernetes-components-versions-cancel',
    changeVersionSuccessMessage: 'Components versions updated successfully',
    component: '$kubernetes-component',
    componentSelector: (component) => locate(this.manageVersion.component)
      .find('span')
      .withText(component),
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
    getRecommendVersion: (component) => locate(`$${component}-options`)
      .find('span')
      .withText('Recommended')
      .find('//preceding-sibling::span'),
    modalHeader: '$modal-header',
    operatorSelector: (operator) => locate(this.manageVersion.operator)
      .find('span')
      .withText(operator),
    operator: '$kubernetes-operator',
    saveButton: '$kubernetes-components-versions-save',
    versionCheckBox: (component, versionNumber) => locate(`$${component}-options`)
      .find('span')
      .withText(versionNumber)
      .find('//parent::div//label//span'),
    versionsSection: (component) => locate(`$${component}-options`)
      .find('//div[contains(@data-qa, "-option")]'),
    versionSelectorFieldErrorMessage: (component) => `$${component}-field-error-message`,
  },

  async getTotalSupportedVersions(component) {
    const numOfElements = await I.grabNumberOfVisibleElements(this.manageVersion.versionsSection(component));

    return numOfElements;
  },

  async getTotalRecommendedVersions(component) {
    const numOfElements = await I.grabNumberOfVisibleElements(
      this.manageVersion.getRecommendVersion(component),
    );

    return numOfElements;
  },

  async getSupportedVersion(component, position) {
    const versionNumber = await I.grabTextFrom(this.manageVersion.getVersionNumber(component, position));

    return versionNumber;
  },

  async getRecommendedVersion(component) {
    const version = await I.grabTextFrom(this.manageVersion.getRecommendVersion(component)
      .last());

    return version;
  },

  async getAllVersionsSupported(component) {
    return await I.grabTextFromAll(this.manageVersion.getVersionNumberLocator(component));
  },

  async getAllRecommendedVersions(component) {
    return await I.grabTextFromAll(this.manageVersion.getRecommendVersion(component));
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
    const recommendedVersions = await I.grabTextFromAll(this.manageVersion.getRecommendVersion(component));

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
      ),
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
      ),
    );
    I.forceClick(
      this.manageVersion.componentSelector(
        componentName,
      ),
    );
  },

  async selectDefaultVersion(version) {
    I.click(this.manageVersion.defaultVersionSelector);
    I.waitForElement(
      this.manageVersion.defaultVersionOption(
        version,
      ),
    );
    I.forceClick(
      this.manageVersion.defaultVersionOption(
        version,
      ),
    );
  },

};
