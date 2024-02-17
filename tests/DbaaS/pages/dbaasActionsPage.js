const {
  I, dbaasAPI, adminPage, dbaasPage,
} = inject();
const assert = require('assert');

module.exports = {

  /**
   * @param actionName - one of 'Delete', 'Restart', 'Edit', 'Suspend', 'Resume'
   * @param isActionPossible - true or false
   * @param dbclusterName - name of DB cluster
   */
  async checkActionPossible(actionName, isActionPossible, dbclusterName) {
    const numOfElements = await I.grabNumberOfVisibleElements(
      dbaasPage.tabs.dbClusterTab.fields.clusterAction(actionName),
    );

    if (numOfElements === 0) {
      I.forceClick(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbclusterName));
    }

    const actionClass = await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.fields.clusterAction(actionName), 'class');

    if (isActionPossible) {
      assert.strictEqual(actionClass, null, `User Should be able to Perform ${actionName} on the DB Cluster`);
    } else {
      assert.notStrictEqual(actionClass, null, `User Should not be able to Perform ${actionName} on the DB Cluster`);
    }
  },

  async createClusterBasicOptions(k8sClusterName, dbClusterName, dbType, dbVersion) {
    I.waitForElement(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 30);
    I.waitForEnabled(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 10);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.basicOptions.fields.clusterNameField, 30);
    I.click(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseTypeField);
    I.fillField(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseTypeInputField, dbType);
    I.waitForElement(
      dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseTypeFieldSelect(dbType),
    );
    I.click(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseTypeFieldSelect(dbType));
    adminPage.customClearField(dbaasPage.tabs.dbClusterTab.basicOptions.fields.clusterNameField);
    I.fillField(dbaasPage.tabs.dbClusterTab.basicOptions.fields.clusterNameField, dbClusterName);

    if (dbVersion) {
      I.click(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseVersionField);
      I.waitForElement(
        dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseVersionSelect(dbVersion),
      );
      I.click(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseVersionSelect(dbVersion));
    }
  },

  async createClusterAdvancedOption(k8sClusterName, dbClusterName, dbType, configuration, dbVersion) {
    await this.createClusterBasicOptions(k8sClusterName, dbClusterName, dbType, dbVersion);
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptionsButton);
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodeSelect);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodesOption(
      configuration.resourcePerNode,
    ), 10);
    if (configuration.resourcePerNode === 'Custom') {
      I.click(
        dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodesOption(configuration.resourcePerNode),
      );
      adminPage.customClearField(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryField);
      I.fillField(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryField, configuration.memory);
      adminPage.customClearField(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuNumberFields);
      I.fillField(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuNumberFields, configuration.cpu);
      adminPage.customClearField(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.diskSizeInputField);
      I.fillField(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.diskSizeInputField, configuration.disk);
    }
  },

  async enableFeatureToggle(toggleLocator, locatorToBeVisible) {
    I.seeElement(toggleLocator);
    I.click(toggleLocator);
    I.waitForElement(locatorToBeVisible, 10);
  },

  async selectDropdownItem(dropdownLocator, itemToSelect) {
    I.seeElement(dropdownLocator);
    I.click(dropdownLocator);
    I.waitForElement(dbaasPage.common.selectOptionInDropdown(itemToSelect));
    I.click(dbaasPage.common.selectOptionInDropdown(itemToSelect));
  },

  async selectBackupArtifact(artifactName) {
    I.seeElement(dbaasPage.tabs.dbClusterTab.restore.backupArtifactSelect);
    I.click(dbaasPage.tabs.dbClusterTab.restore.backupArtifactSelect);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.restore.backupArtifactSelectValue(artifactName));
    I.click(dbaasPage.tabs.dbClusterTab.restore.backupArtifactSelectValue(artifactName));
  },

  async selectSecretsName(secret) {
    I.seeElement(dbaasPage.tabs.dbClusterTab.restore.secretsNameSelect);
    I.click(dbaasPage.tabs.dbClusterTab.restore.secretsNameSelect);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.restore.secretsNameSelectValue(secret));
    I.click(dbaasPage.tabs.dbClusterTab.restore.secretsNameSelectValue(secret));
  },

  async deleteXtraDBCluster(dbClusterName, k8sClusterName) {
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterTableHeader, 30);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName), 30);
    I.forceClick(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName));
    await this.checkActionPossible('Delete', true, dbClusterName);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Delete'), 30);
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Delete'));
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.deleteDBClusterButton, 30);
    I.seeElement(dbaasPage.tabs.dbClusterTab.fields.cancelDeleteDBCluster, 30);
    I.seeTextEquals(
      dbaasPage.tabs.dbClusterTab.deleteDbClusterConfirmationText(dbClusterName, k8sClusterName, 'MySQL'),
      dbaasPage.tabs.kubernetesClusterTab.modalContentText,
    );
    I.click(dbaasPage.tabs.dbClusterTab.fields.deleteDBClusterButton);
    await dbaasAPI.waitForDbClusterDeleted(dbClusterName, k8sClusterName);
  },

  async restartCluster(dbClusterName, k8sClusterName, clusterDBType = 'MySQL') {
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterTableHeader, 30);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName), 30);
    I.forceClick(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName));
    await this.checkActionPossible('Restart', true, dbClusterName);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Restart'), 30);
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Restart'));
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent(dbClusterName));
    await dbaasAPI.waitForDBClusterState(dbClusterName, k8sClusterName, clusterDBType, 'DB_CLUSTER_STATE_READY');
  },

  async editCluster(dbClusterName, k8sClusterName, configuration) {
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterTableHeader, 30);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName), 30);
    I.forceClick(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName));
    await this.checkActionPossible('Edit', true, dbClusterName);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Edit'), 30);
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Edit'));
    I.seeAttributesOnElements(
      dbaasPage.tabs.dbClusterTab.advancedOptions.fields.diskSizeInputField,
      { disabled: true },
    );
    if (configuration.numberOfNodes) {
      adminPage.customClearField(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesNumberField);
      I.fillField(
        dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesNumberField,
        configuration.numberOfNodes,
      );
    }

    if (configuration.resourcePerNode === 'Custom') {
      I.click(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodeSelect);
      I.waitForVisible(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodesOption(
        configuration.resourcePerNode,
      ), 10);
      I.click(
        dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodesOption(configuration.resourcePerNode),
      );
      adminPage.customClearField(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryField);
      I.fillField(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryField, configuration.memory);
      adminPage.customClearField(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuNumberFields);
      I.fillField(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuNumberFields, configuration.cpu);
    }
  },

  async suspendCluster(dbClusterName, k8sClusterName, clusterDBType = 'MySQL') {
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterTableHeader, 30);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName), 30);
    I.forceClick(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName));
    await this.checkActionPossible('Suspend', true, dbClusterName);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Suspend'), 30);
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Suspend'));
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent(dbClusterName));
    await this.checkActionPossible('Resume', false, dbClusterName);
    await dbaasAPI.waitForDBClusterState(dbClusterName, k8sClusterName, clusterDBType, 'DB_CLUSTER_STATE_PAUSED');
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterTab);
  },

  async resumeCluster(dbClusterName, k8sClusterName, clusterDBType = 'MySQL') {
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterTableHeader, 30);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName), 30);
    I.forceClick(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName));
    await this.checkActionPossible('Resume', true, dbClusterName);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Resume'), 30);
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Resume'));
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent(dbClusterName));
    await dbaasAPI.waitForDBClusterState(dbClusterName, k8sClusterName, clusterDBType, 'DB_CLUSTER_STATE_READY');
  },

  async deletePSMDBCluster(dbClusterName, k8sClusterName) {
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterTableHeader, 30);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName), 30);
    I.forceClick(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName));
    await this.checkActionPossible('Delete', true, dbClusterName);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Delete'), 30);
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Delete'));
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.deleteDBClusterButton, 30);
    I.seeElement(dbaasPage.tabs.dbClusterTab.fields.cancelDeleteDBCluster, 30);
    I.seeTextEquals(
      dbaasPage.tabs.dbClusterTab.deleteDbClusterConfirmationText(dbClusterName, k8sClusterName, 'MongoDB'),
      dbaasPage.tabs.kubernetesClusterTab.modalContentText,
    );
    I.click(dbaasPage.tabs.dbClusterTab.fields.deleteDBClusterButton);
    await dbaasAPI.waitForDbClusterDeleted(dbClusterName, k8sClusterName, 'MongoDB');
  },

  async showClusterLogs(dbClusterName) {
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName), 30);
    I.forceClick(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName));
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterAction('View logs'), 30);
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterAction('View logs'));
  },

  async verifyInsufficientResources(resourceType, warningMessage) {
    I.seeElement(
      dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourceBarInsufficientResources(
        resourceType,
      ),
    );
    I.see(
      warningMessage,
      dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourceBarInsufficientResources(
        resourceType,
      ),
    );
    await adminPage.verifyBackgroundColor(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourceBarResourceIndication(
      resourceType,
    ), 'rgb(209, 14, 92)');
  },

  async updateCluster(dbClusterName) {
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterTableHeader, 30);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName), 30);
    I.forceClick(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName));
    await this.checkActionPossible('Update', true, dbClusterName);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Update'), 30);
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterAction('Update'));
    I.waitForElement(dbaasPage.tabs.dbClusterTab.confirmUpdateButton, 30);
    I.click(dbaasPage.tabs.dbClusterTab.confirmUpdateButton);
  },
};
