const assert = require('assert');
const { forEach } = require('lodash');

const { dbaasPage } = inject();

const clusterName = 'minikube';

const inputFields = new DataTable(['field', 'value', 'errorMessageField', 'errorMessage']);

const resourceFields = new DataTable(['resourceType']);

const nameFields = new DataTable(['field', 'value', 'errorMessageField', 'errorMessage']);

const podName = new DataTable(['podNameValue', 'noDataCount']);

podName.add(['dbaas-operator', '1']);
podName.add(['kube-state-metrics', '4']);
podName.add(['percona-server-mongodb-operator', '4']);
podName.add(['percona-xtradb-cluster-operator', '4']);
podName.add(['vm-operator', '1']);
podName.add(['vmagent-pmm-vmagent', '0']);

// This is Data table for Resources available for DB Cluster, used for checking Default Values.

resourceFields.add(['Small']);
resourceFields.add(['Medium']);
resourceFields.add(['Large']);
resourceFields.add(['Custom']);

// PMM-T456 based on the test case for field validation and error message on different input values.

inputFields.add([dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesNumberField, ['a'], dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesFieldErrorMessage, dbaasPage.requiredFieldError]);
inputFields.add([dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryField, ['a'], dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryFieldErrorMessage, dbaasPage.requiredFieldError]);
inputFields.add([dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuNumberFields, ['a'], dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuFieldErrorMessage, dbaasPage.requiredFieldError]);
inputFields.add([dbaasPage.tabs.dbClusterTab.advancedOptions.fields.diskSizeInputField, ['a'], dbaasPage.tabs.dbClusterTab.advancedOptions.fields.diskFieldErrorMessage, dbaasPage.requiredFieldError]);
inputFields.add([dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesNumberField, ['-1', '0', '0.5'], dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesFieldErrorMessage, dbaasPage.requiredFieldError]);
inputFields.add([dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesNumberField, ['2'], dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesFieldErrorMessage, dbaasPage.numberOfNodesError]);
inputFields.add([dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryField, ['0.01', '-0.3', '0.0'], dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryFieldErrorMessage, dbaasPage.valueGreatThanErrorText(0.1)]);
inputFields.add([dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuNumberFields, ['0.01', '-0.3', '0.0'], dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuFieldErrorMessage, dbaasPage.valueGreatThanErrorText(0.1)]);

// Data table for db cluster name validation

nameFields.add([dbaasPage.tabs.dbClusterTab.basicOptions.fields.clusterNameField, ['1cluster', 'clusterA', 'cluster-'], dbaasPage.tabs.dbClusterTab.basicOptions.fields.clusterNameFieldErrorMessage, dbaasPage.dbclusterNameError]);

Feature('DbaaS: Kubernetes Cluster Registration UI');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T426 - Verify adding new Kubernetes cluster minikube, PMM-T428 - Verify adding new Kubernetes cluster with same name, '
    + 'PMM-T431 - Verify unregistering Kubernetes cluster, PMM-T1344 - Verify public address is set automatically on DBaaS page,  @dbaas',
  async ({ I, dbaasPage, dbaasAPI }) => {
    I.amOnPage(dbaasPage.url);
    I.waitForVisible(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButtonInTable, 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButton);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.monitoringWarningLocator, 30);
    I.waitForText(dbaasPage.monitoringWarningMessage, 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.cancelButton);
    dbaasPage.registerKubernetesCluster(clusterName, process.env.kubeconfig_minikube);
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.spinner);
    I.waitForText(dbaasPage.addedAlertMessage, 60);
    dbaasPage.checkCluster(clusterName, false);
    I.click(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButton);
    I.dontSeeElement(dbaasPage.tabs.dbClusterTab.monitoringWarningLocator, 30);
    I.dontSee(dbaasPage.monitoringWarningMessage);
    I.click(dbaasPage.tabs.kubernetesClusterTab.cancelButton);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterTableRow(clusterName));
    // PMM-T428 - starting here
    dbaasPage.registerKubernetesCluster(clusterName, process.env.kubeconfig_minikube);
    dbaasPage.seeErrorForAddedCluster(clusterName);
    I.click(dbaasPage.tabs.kubernetesClusterTab.cancelButton);
    // PMM-T431 starting here, unregister cluster using unregister option
    await dbaasAPI.waitForOperators();
    dbaasPage.unregisterCluster(clusterName, true);
    I.waitForText(dbaasPage.deletedAlertMessage, 20);
    I.refreshPage();
    dbaasPage.checkCluster(clusterName, true);
  },
).retry(1);

Scenario(
  'PMM-T427 - Verify submitting blank Add kubernetes cluster form @dbaas',
  async ({ I, dbaasPage }) => {
    I.amOnPage(dbaasPage.url);
    I.waitForVisible(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButtonInTable, 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButton);
    I.waitForVisible(dbaasPage.tabs.kubernetesClusterTab.disabledRegisterButton, 100);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.disabledRegisterButton);
    I.click(dbaasPage.tabs.kubernetesClusterTab.kubernetesClusterNameInput);
    I.click(dbaasPage.tabs.kubernetesClusterTab.kubeconfigFileInput);
    I.click(dbaasPage.tabs.kubernetesClusterTab.kubernetesClusterNameInput);
    const count = await I.grabNumberOfVisibleElements(dbaasPage.tabs.kubernetesClusterTab.requiredField);

    assert.ok(count === 2, `Count of error messages is: ${count} but should be 2`);
    I.fillField(dbaasPage.tabs.kubernetesClusterTab.kubeconfigFileInput, 'Kubernetes_Config_Test');
    I.fillField(dbaasPage.tabs.kubernetesClusterTab.kubernetesClusterNameInput, clusterName);
    I.dontSeeElement(dbaasPage.tabs.kubernetesClusterTab.disabledRegisterButton);
    I.waitForVisible(dbaasPage.tabs.kubernetesClusterTab.registerButton);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.registerButton);
  },
);

Scenario(
  'PMM-T1451 - Verify Register new Kubernetes Cluster page @dbaas',
  async ({ I, dbaasPage }) => {
    I.amOnPage(dbaasPage.url);
    I.waitForVisible(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButtonInTable, 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButtonInTable);
    I.waitForVisible(dbaasPage.tabs.kubernetesClusterTab.registerNewClusterHeader);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.genericClusterLabel);
    I.seeCheckboxIsChecked(dbaasPage.tabs.kubernetesClusterTab.genericEksClusterRadio);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.pasteFromClipboardButton);
    I.click(dbaasPage.tabs.kubernetesClusterTab.eksClusterLabel);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.kubeconfigFileInput);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.kubernetesClusterNameInput);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.awsAccessKeyInput);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.awsSecretKeyInput);
  },
);

Data(podName).Scenario(
  'PMM-T1122 Verify DB Cluster Summary dashboard @dbaas',
  async ({
    I, dbClusterSummaryDashboardPage, dashboardPage, adminPage, current,
  }) => {
    await I.amOnPage(dbClusterSummaryDashboardPage.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Pod', current.podNameValue);
    await dashboardPage.expandEachDashboardRow();
    I.click(adminPage.fields.metricTitle);
    dashboardPage.verifyMetricsExistence(dbClusterSummaryDashboardPage.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(current.noDataCount);
  },
);

Scenario(
  'PMM-T547 PMM-T548  Verify user is able to view config of registered Kubernetes cluster on Kubernetes Cluster Page, '
    + 'PMM-T1130 - Verify warning about deleting an API key @dbaas',
  async ({ I, dbaasPage, dbaasAPI }) => {
    await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    I.amOnPage(dbaasPage.url);
    await dbaasPage.goToKubernetesClusterTab();
    dbaasPage.checkCluster(clusterName, false);
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.actionsLocator(clusterName), 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.actionsLocator(clusterName));
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.viewClusterConfiguration, 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.viewClusterConfiguration);
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.modalContent, 30);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.copyToClipboardButton);
    I.click(dbaasPage.tabs.kubernetesClusterTab.copyToClipboardButton);
    I.waitForText(dbaasPage.configurationCopiedMessage, 30);
    // FIXME: skip until https://jira.percona.com/browse/PMM-10688 is fixed
    // const configuration = await I.grabTextFrom(dbaasPage.tabs.kubernetesClusterTab.clusterConfigurationText);

    // assert.ok(configuration === process.env.kubeconfig_minikube,
    //   `The configuration shown is not equal to the expected Cluster configuration, ${configuration}`);
    // PMM-T1130
    I.amOnPage(dbaasPage.apiKeysUrl);
    I.waitForText(dbaasPage.apiKeysPage.apiKeysWarningText, 10, dbaasPage.apiKeysPage.apiKeysWarningLocator);
    await dbaasAPI.apiUnregisterCluster(clusterName);
  },
);

Scenario(
  'Verify user is able to add same cluster config with different Name @dbaas',
  async ({ I, dbaasPage, dbaasAPI }) => {
    const clusterName1 = 'Kubernetes_Testing_Cluster_1';
    const clusterName2 = 'Kubernetes_Testing_Cluster_2';

    await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName1);
    await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName2);
    I.amOnPage(dbaasPage.url);
    await dbaasPage.goToKubernetesClusterTab();
    dbaasPage.checkCluster(clusterName1, false);
    dbaasPage.checkCluster(clusterName2, false);
    await dbaasAPI.apiUnregisterCluster(clusterName1);
    await dbaasAPI.apiUnregisterCluster(clusterName2);
    I.refreshPage();
    dbaasPage.checkCluster(clusterName2, true);
    dbaasPage.checkCluster(clusterName1, true);
  },
);

Scenario(
  'PMM-T728 Verify DB Cluster Tab Page Elements & Steps Background @dbaas',
  async ({ I, dbaasPage, dbaasAPI }) => {
    if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
      await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    }

    await dbaasAPI.waitForClusterStatus();
    I.amOnPage(dbaasPage.url);
    I.waitForEnabled(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 10);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop);
    I.seeElement(dbaasPage.tabs.dbClusterTab.basicOptions.fields.clusterNameField);
    I.seeElement(dbaasPage.tabs.dbClusterTab.basicOptions.fields.kubernetesClusterDropDown);
    I.seeElement(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseTypeField);
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptionsButton);
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptionsButton);
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesNumberField);
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodeLabel);
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryField);
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuNumberFields);
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.diskSizeInputField);
    I.seeElement(dbaasPage.tabs.dbClusterTab.createClusterButton);
    await dbaasAPI.apiUnregisterCluster(clusterName);
  },
);

Data(nameFields).Scenario(
  'PMM-T456 Verify Create Cluster steps validation fields disabled/enabled + name input validation, PMM-T833 - Verify DB cluster name length @dbaas',
  async ({
    I, dbaasPage, dbaasAPI, adminPage, current, dbaasActionsPage,
  }) => {
    if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
      await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    }

    await dbaasAPI.waitForClusterStatus();
    I.amOnPage(dbaasPage.url);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.dbClusterTab);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterTab);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.addDbClusterButton, 60);
    I.dontSeeElement(adminPage.fields.timePickerMenu);
    await dbaasActionsPage.createClusterBasicOptions(clusterName, 'a2345678901234567890', 'MySQL');
    I.dontSee(dbaasPage.dbclusterNameLimitError, dbaasPage.tabs.dbClusterTab.basicOptions.fields.clusterNameFieldErrorMessage);
    adminPage.customClearField(current.field);
    I.fillField(dbaasPage.tabs.dbClusterTab.basicOptions.fields.clusterNameField, 'a23456789012345678901');
    I.seeTextEquals(
      dbaasPage.dbclusterNameLimitError,
      dbaasPage.tabs.dbClusterTab.basicOptions.fields.clusterNameFieldErrorMessage,
    );
    current.value.forEach((input) => dbaasPage.verifyInputValidationMessages(
      current.field,
      input,
      current.errorMessageField,
      current.errorMessage,
    ));
    assert.ok(
      await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.createClusterButton, 'disabled'),
      'Create Cluster Button Should be Disabled',
    );
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptionsButton);
    assert.ok(
      await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.createClusterButton, 'disabled'),
      'Create Cluster Button Should Still be Disabled',
    );
    assert.ok(
      await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryField, 'disabled'),
      'Memory Field Should be Disabled',
    );
    assert.ok(
      await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuNumberFields, 'disabled'),
      'Number of CPU Field Should be disabled',
    );
    assert.ok(
      await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.diskSizeInputField, 'disabled'),
      'Disk Size field must be disabled',
    );
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodeSelect);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodesOption('Custom'), 10);
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodesOption('Custom'));
    I.waitForEnabled(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryField, 3);
    I.waitForEnabled(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.diskSizeInputField, 3);
    I.waitForEnabled(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuNumberFields, 3);
    await dbaasAPI.apiUnregisterCluster(clusterName);
  },
);

Data(inputFields).Scenario(
  'PMM-T456 Verify Create Cluster steps validation - field input validation @dbaas',
  async ({
    I, dbaasPage, dbaasAPI, adminPage, current, dbaasActionsPage,
  }) => {
    if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
      await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    }

    await dbaasAPI.waitForClusterStatus();
    I.amOnPage(dbaasPage.url);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.addDbClusterButton, 60);
    await dbaasActionsPage.createClusterBasicOptions(clusterName, 'dbcluster', 'MySQL');
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptionsButton);
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptionsButton);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodeSelect);
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodeSelect);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodesOption('Custom'), 10);
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodesOption('Custom'));
    adminPage.customClearField(current.field);
    current.value.forEach((input) => dbaasPage.verifyInputValidationMessages(
      current.field,
      input,
      current.errorMessageField,
      current.errorMessage,
    ));
    assert.ok(
      await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.createClusterButton, 'disabled'),
      'Create Cluster Button Should Still be Disabled',
    );
  },
);

Data(resourceFields).Scenario(
  'PMM-T828 Verify the Configuration for Small, Medium, Large Resource @dbaas',
  async ({
    I, dbaasPage, dbaasAPI, current,
  }) => {
    if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
      await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    }

    I.amOnPage(dbaasPage.url);
    I.waitForEnabled(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 10);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.advancedOptionsButton, 10);
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptionsButton);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodeSelect);
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodeSelect);
    I.waitForVisible(
      dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodesOption(current.resourceType),
      30,
    );
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNodesOption(current.resourceType));
    let value = await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuNumberFields, 'value');

    await dbaasPage.validateResourcesField('cpu', current.resourceType, value);
    value = await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryField, 'value');
    await dbaasPage.validateResourcesField('memory', current.resourceType, value);
    value = await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.diskSizeInputField, 'value');
    await dbaasPage.validateResourcesField('disk', current.resourceType, value);
  },
);

Scenario(
  'PMM-T546 Verify Actions column on Kubernetes cluster page @dbaas',
  async ({ I, dbaasPage, dbaasAPI }) => {
    if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
      await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    }

    I.amOnPage(dbaasPage.url);
    await dbaasPage.goToKubernetesClusterTab();
    dbaasPage.checkCluster(clusterName, false);
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.actionsLocator(clusterName), 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.actionsLocator(clusterName));
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.viewClusterConfiguration, 30);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.manageVersions);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.viewClusterConfiguration);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.unregisterButton);
  },
);

Scenario(
  'PMM-T969 - Verify pmm-client logs when incorrect public address is set @dbaas',
  async ({
    I, settingsAPI, dbaasAPI, dbaasPage, dbaasActionsPage,
  }) => {
    const dbClusterName = dbaasPage.randomizeClusterName('dbcluster');
    const dbType = 'MySQL';
    const address = 'https://1.2.3.4';
    const logsText = `Registering pmm-agent on PMM Server...
Failed to register pmm-agent on PMM Server: Post "https://https:%2F%2F1.2.3.4/v1/management/Node/Register": dial tcp: lookup ${address}: no such host.`;

    await settingsAPI.changeSettings({ publicAddress: address });
    await dbaasAPI.createCustomPXC(clusterName, dbClusterName, '1');

    I.amOnPage(dbaasPage.url);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent(dbClusterName));
    await dbaasAPI.waitForDBClusterState(dbClusterName, clusterName, dbType, 'DB_CLUSTER_STATE_READY');
    await dbaasActionsPage.showClusterLogs(dbClusterName);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.dbClusterLogs.expandAllLogsButton, 30);
    I.click(dbaasPage.tabs.dbClusterTab.fields.dbClusterLogs.expandAllLogsButton);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.dbClusterLogs.expandedContainersLogsSection, 30);
    I.waitForText(
      'Restarting `pmm-admin setup` in 5 seconds because PMM_AGENT_SIDECAR is enabled...',
      120,
      dbaasPage.tabs.dbClusterTab.fields.dbClusterLogs.expandedContainersLogsSection,
    );

    const pmmClientLogsText = await I.grabTextFrom(
      dbaasPage.tabs.dbClusterTab.fields.dbClusterLogs.expandedContainersLogsSection,
    );

    assert.ok(pmmClientLogsText.includes(logsText), `Pmm-client logs must contain text: ${logsText}`);
  },
).retry(1);

Scenario(
  '@PMM-T1512 Verify tooltips work properly for DBaaS page @dbaas',
  async ({
    I, dbaasPage, adminPage,
  }) => {
    I.amOnPage(dbaasPage.url);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 60);
    await adminPage.verifyTooltip(dbaasPage.tooltips.technicalPreview);
    I.click(dbaasPage.tabs.kubernetesClusterTab.kubernetesClusterTabButton);
    I.click(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButton);
    I.click(dbaasPage.tabs.kubernetesClusterTab.eksClusterLabel);
    const tooltips = [
      dbaasPage.tooltips.clusterType,
      dbaasPage.tooltips.awsSecretAccessKey,
      dbaasPage.tooltips.awsAccessKeyId,
    ];

    for (const tooltip of tooltips) {
      await adminPage.verifyTooltip(tooltip);
    }
  },
);

Scenario(
  'PMM-T1571 Verify Create DB Cluster page @dbaas',
  async ({ I, dbaasPage, adminPage }) => {
    I.amOnPage(dbaasPage.url);
    I.waitForEnabled(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 10);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.advancedOptionsButton);
    I.dontSeeElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesNumberField);
    I.seeElement(dbaasPage.tabs.dbClusterTab.externalAccess.enableExtAcceessLabel);
    I.click(dbaasPage.tabs.dbClusterTab.externalAccess.enableExtAcceessToggle);
    await adminPage.verifyTooltip(dbaasPage.tooltips.externalAccess);
    await adminPage.verifyTooltip(dbaasPage.tooltips.internetFacing);
    I.seeElement(dbaasPage.tabs.dbClusterTab.externalAccess.internetFacingLabel);
    I.scrollTo(dbaasPage.tabs.dbClusterTab.externalAccess.sourceRangesLabel);
    I.click(dbaasPage.tabs.dbClusterTab.externalAccess.addNewSourceRangeButton);
    I.click(dbaasPage.tabs.dbClusterTab.externalAccess.addNewSourceRangeButton);
    await dbaasPage.verifySourceRangeCount(3);
    I.click(dbaasPage.tabs.dbClusterTab.externalAccess.deleteSourceRangeButton(2));
    await dbaasPage.verifySourceRangeCount(2);
    I.click(dbaasPage.tabs.dbClusterTab.externalAccess.deleteSourceRangeButton(1));
    await dbaasPage.verifySourceRangeCount(1);
    I.click(dbaasPage.tabs.dbClusterTab.externalAccess.deleteSourceRangeButton(0));
    await dbaasPage.verifySourceRangeCount(1);

    I.click(dbaasPage.tabs.dbClusterTab.advancedOptionsButton);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesNumberField);
    I.scrollTo(dbaasPage.tabs.dbClusterTab.dbConfigurations.configurationsHeader('MySQL'));
    I.seeElement(dbaasPage.tabs.dbClusterTab.dbConfigurations.storageClassLabel);
    I.seeElement(dbaasPage.tabs.dbClusterTab.dbConfigurations.configurationLabel('MySQL'));
    I.click(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseTypeField);
    I.fillField(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseTypeInputField, 'MongoDB');
    I.waitForElement(
      dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseTypeFieldSelect('MongoDB'),
    );
    I.click(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseTypeFieldSelect('MongoDB'));
    I.seeElement(dbaasPage.tabs.dbClusterTab.dbConfigurations.configurationsHeader('MongoDB'));
    I.seeElement(dbaasPage.tabs.dbClusterTab.dbConfigurations.storageClassLabel);
    I.scrollTo(dbaasPage.tabs.dbClusterTab.dbConfigurations.configurationLabel('MongoDB'));
    I.seeElement(dbaasPage.tabs.dbClusterTab.externalAccess.internetFacingLabel);
    I.seeElement(dbaasPage.tabs.dbClusterTab.externalAccess.sourceRangesLabel);
  },
);
