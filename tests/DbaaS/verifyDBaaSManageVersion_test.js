const assert = require('assert');

const { dbaasPage, dbaasManageVersionPage } = inject();

const clusterName = 'Kubernetes_Manage_Versions_Minikube';

const dbClusterName = 'testing-versions';

const versionVerification = new DataTable(['component', 'operatorVersion', 'componentName', 'dbType']);

// This is datatable for Version supported for each component, this is to check with default values.

versionVerification.add([
  dbaasManageVersionPage.components.PSMDB.dataqa,
  dbaasManageVersionPage.operatorVersion.PSMDB,
  dbaasManageVersionPage.components.PSMDB.name,
  'MongoDB',
]);
versionVerification.add([
  dbaasManageVersionPage.components.PXC.dataqa,
  dbaasManageVersionPage.operatorVersion.PXC,
  dbaasManageVersionPage.components.PXC.name,
  'MySQL',
]);
versionVerification.add([
  dbaasManageVersionPage.components.HAPROXY.dataqa,
  dbaasManageVersionPage.operatorVersion.PXC,
  dbaasManageVersionPage.components.HAPROXY.name,
  'MySQL',
]);

Feature('DbaaS: Manage Version Action flows & validation');

BeforeSuite(async ({ dbaasAPI }) => {
  await dbaasAPI.apiUnregisterAllCluster();
  if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
    await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
  }
});

AfterSuite(async ({ dbaasAPI }) => {
  await dbaasAPI.apiUnregisterCluster(clusterName, true);
});

Before(async ({ I }) => {
  await I.Authorize();
});

Data(versionVerification).Scenario('PMM-T760 Verify Manage Components Versions @dbaas',
  async ({
    I, dbaasPage, dbaasManageVersionPage, current,
  }) => {
    const {
      component, operatorVersion, componentName, dbType,
    } = current;

    I.amOnPage(dbaasPage.url);
    dbaasPage.checkCluster(clusterName, false);
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.actionsLocator(clusterName), 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.actionsLocator(clusterName));
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.manageVersions, 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.manageVersions);
    I.waitForDetached(dbaasManageVersionPage.loader, 30);
    await dbaasManageVersionPage.selectOperatorVersion(operatorVersion);
    await dbaasManageVersionPage.selectComponent(componentName);
    const count = await dbaasManageVersionPage.getTotalSupportedVersions(component);
    const recommendedVersion = await dbaasManageVersionPage.getRecommendedVersion(component);

    I.seeElement(dbaasManageVersionPage.manageVersion.defaultVersionOption(recommendedVersion));
    // This is to check if all versions by default are supported.
    await dbaasManageVersionPage.verifyAllVersionSupportedByDefault(component, count);
  });

Scenario('PMM-T765 Verify Manage Components Versions ' 
 + 'PMM-T1315 - Verify DBaaS naming @dbaas',
  async ({
    I, dbaasPage, dbaasManageVersionPage,
  }) => {
    I.amOnPage(dbaasPage.url);
    dbaasPage.checkCluster(clusterName, false);
    I.see(dbaasManageVersionPage.operatorVersion.PXC, dbaasPage.tabs.dbClusterTab.fields.clusterTableRow);
    I.see(dbaasManageVersionPage.operatorVersion.PSMDB, dbaasPage.tabs.dbClusterTab.fields.clusterTableRow);
    dbaasManageVersionPage.waitForManageVersionPopup(clusterName);
    I.waitForText(
      dbaasManageVersionPage.manageVersion.dialogTitle,
      30,
      dbaasManageVersionPage.manageVersion.modalHeader,
    );
    I.seeElement(dbaasManageVersionPage.manageVersion.cancelButton);
    I.seeElement(dbaasManageVersionPage.manageVersion.saveButton);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.modalCloseButton);
    I.seeElement(dbaasManageVersionPage.manageVersion.operator);
    I.seeElement(dbaasManageVersionPage.manageVersion.component);
    I.seeElement(
      dbaasManageVersionPage.manageVersion.versionsSection(
        dbaasManageVersionPage.components.PXC.dataqa,
      ),
    );
    I.seeElement(dbaasManageVersionPage.manageVersion.defaultVersionSelector);
    I.click(dbaasManageVersionPage.manageVersion.cancelButton);
    I.waitForInvisible(dbaasManageVersionPage.manageVersion.dialogTitle);
    I.dontSeeElement(dbaasManageVersionPage.manageVersion.dialogTitle);
    dbaasManageVersionPage.waitForManageVersionPopup(clusterName);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.modalCloseButton);
    I.click(dbaasPage.tabs.kubernetesClusterTab.modalCloseButton);
    I.waitForInvisible(dbaasManageVersionPage.manageVersion.dialogTitle);
    I.dontSeeElement(dbaasManageVersionPage.manageVersion.dialogTitle);
    dbaasManageVersionPage.waitForManageVersionPopup(clusterName);
    I.click(dbaasManageVersionPage.manageVersion.operator);
  });

// FIXME: Skip until https://jira.percona.com/browse/PMM-10683 is fixed
xData(versionVerification).Scenario('PMM-T760 PMM-T762 PMM-T770 Saving Custom Version for Dbaas Operators @dbaas',
  async ({
    I, dbaasPage, dbaasActionsPage, dbaasManageVersionPage, current,
  }) => {
    const {
      component, operatorVersion, componentName, dbType,
    } = current;

    I.amOnPage(dbaasPage.url);
    dbaasPage.checkCluster(clusterName, false);
    dbaasManageVersionPage.waitForManageVersionPopup(clusterName);
    await dbaasManageVersionPage.selectOperatorVersion(operatorVersion);
    await dbaasManageVersionPage.selectComponent(componentName);
    // To uncheck all supported versions.
    await dbaasManageVersionPage.selectAllSupportedVersions(component);

    // Error Message for Required Field
    I.see(
      dbaasManageVersionPage.manageVersion.errorMessageRequiredField,
      dbaasManageVersionPage.manageVersion.versionSelectorFieldErrorMessage(component),
    );
    I.see(
      dbaasManageVersionPage.manageVersion.errorMessageRequiredField,
      dbaasManageVersionPage.manageVersion.defaultVersionSelectorFieldErrorMessage,
    );
    I.seeAttributesOnElements(dbaasManageVersionPage.manageVersion.saveButton, { disabled: true });

    const getRecommendedVersions = await dbaasManageVersionPage.getAllRecommendedVersions(component);

    // Select Recommended Versions
    await dbaasManageVersionPage.setVersions(component, getRecommendedVersions);

    // Error Message on Version Selector Should be gone
    I.dontSee(
      dbaasManageVersionPage.manageVersion.errorMessageRequiredField,
      dbaasManageVersionPage.manageVersion.versionSelectorFieldErrorMessage(component),
    );

    // Save button should still be disabled.
    I.see(
      dbaasManageVersionPage.manageVersion.errorMessageRequiredField,
      dbaasManageVersionPage.manageVersion.defaultVersionSelectorFieldErrorMessage,
    );
    I.seeAttributesOnElements(dbaasManageVersionPage.manageVersion.saveButton, { disabled: true });

    I.click(dbaasManageVersionPage.manageVersion.defaultVersionSelector);
    getRecommendedVersions.forEach((version) => {
      I.seeElement(dbaasManageVersionPage.manageVersion.defaultVersionOption(version));
    });
    const getAllSupportedVersion = await dbaasManageVersionPage.getAllVersionsSupported(component);
    const unselectedVersions = getAllSupportedVersion.filter(
      (version) => !getRecommendedVersions.includes(version),
    );

    unselectedVersions.forEach((version) => {
      I.dontSeeElement(dbaasManageVersionPage.manageVersion.defaultVersionOption(version));
    });
    I.click(dbaasManageVersionPage.manageVersion.defaultVersionSelector);

    const defaultRecommendedVersion = await dbaasManageVersionPage.getRecommendedVersion(component);

    await dbaasManageVersionPage.selectDefaultVersion(
      defaultRecommendedVersion,
    );

    // Save button should be enabled now and error messages gone.
    I.dontSee(
      dbaasManageVersionPage.manageVersion.errorMessageRequiredField,
      dbaasManageVersionPage.manageVersion.defaultVersionSelectorFieldErrorMessage,
    );
    I.click(dbaasManageVersionPage.manageVersion.saveButton);
    I.waitForText(dbaasManageVersionPage.manageVersion.changeVersionSuccessMessage, 30);
    I.refreshPage();
    dbaasPage.checkCluster(clusterName, false);
    await dbaasManageVersionPage.waitForManageVersionPopup(clusterName);
    await dbaasManageVersionPage.selectOperatorVersion(operatorVersion);
    await dbaasManageVersionPage.selectComponent(componentName);
    I.click(dbaasManageVersionPage.manageVersion.defaultVersionSelector);
    getRecommendedVersions.forEach((version) => {
      I.seeElement(dbaasManageVersionPage.manageVersion.defaultVersionOption(version));
    });
    unselectedVersions.forEach((version) => {
      I.dontSeeElement(dbaasManageVersionPage.manageVersion.defaultVersionOption(version));
    });
    if (componentName !== dbaasManageVersionPage.components.HAPROXY.name) {
      await dbaasPage.waitForDbClusterTab(clusterName);
      await dbaasActionsPage.createClusterBasicOptions(clusterName, dbClusterName, dbType);
      I.seeElement(
        dbaasPage.tabs.dbClusterTab.basicOptions.fields.defaultDbVersionValue(
          defaultRecommendedVersion,
        ),
      );
      I.click(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseVersionField);
      getRecommendedVersions.forEach((version) => {
        I.waitForElement(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseVersion(version));
        I.seeElement(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseVersion(version));
      });
      unselectedVersions.forEach((version) => {
        I.dontSeeElement(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseVersion(version));
      });
    }
  });
