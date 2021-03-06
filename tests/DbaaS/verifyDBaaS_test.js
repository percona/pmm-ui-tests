const assert = require('assert');

const { dbaasPage } = inject();

const clusterName = 'Kubernetes_Testing_Cluster_Minikube';

const inputFields = new DataTable(['field', 'value', 'errorMessageField', 'errorMessage']);

const resourceFields = new DataTable(['resourceType']);

const nameFields = new DataTable(['field', 'value', 'errorMessageField', 'errorMessage']);

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
inputFields.add([dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesNumberField, ['1', '2'], dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesFieldErrorMessage, dbaasPage.valueGreatThanErrorText(3)]);
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
  + 'PMM-T431 -Verify unregistering Kubernetes cluster, PMM-T1158 - Verify warning about unset public address @dbaas',
  async ({ I, dbaasPage, settingsAPI }) => {
    I.amOnPage(dbaasPage.url);
    I.waitForVisible(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButtonInTable, 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButton);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.modalWindow);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.monitoringWarningLocator, 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.closeButton);
    await settingsAPI.changeSettings({ publicAddress: process.env.VM_IP });
    I.amOnPage(dbaasPage.url);
    I.click(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButton);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.modalWindow);
    I.dontSeeElement(dbaasPage.tabs.dbClusterTab.monitoringWarningLocator, 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.closeButton);
    I.dontSeeElement(dbaasPage.tabs.kubernetesClusterTab.modalWindow);
    I.click(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButton);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.modalWindow);
    I.pressKey('Escape');
    I.dontSeeElement(dbaasPage.tabs.kubernetesClusterTab.modalContent);
    // cannot automate click outside the form
    dbaasPage.registerKubernetesCluster(clusterName, process.env.kubeconfig_minikube);
    I.waitForText(dbaasPage.addedAlertMessage, 10);
    dbaasPage.checkCluster(clusterName, false);
    // PMM-T428 - starting here
    dbaasPage.registerKubernetesCluster(clusterName, process.env.kubeconfig_minikube);
    dbaasPage.seeErrorForAddedCluster(clusterName);
    // PMM-T431 starting here, unregister cluster using unregister option
    dbaasPage.unregisterCluster(clusterName);
    I.waitForText(dbaasPage.deletedAlertMessage, 20);
    dbaasPage.checkCluster(clusterName, true);
  },
);

Scenario(
  'PMM-T427 - Verify submitting blank Add kubernetes cluster form @dbaas',
  async ({ I, dbaasPage }) => {
    I.amOnPage(dbaasPage.url);
    I.waitForVisible(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButtonInTable, 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButton);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton);
    I.click(dbaasPage.tabs.kubernetesClusterTab.kubernetesClusterNameInput);
    I.click(dbaasPage.tabs.kubernetesClusterTab.kubeconfigFileInput);
    I.click(dbaasPage.tabs.kubernetesClusterTab.kubernetesClusterNameInput);
    const count = await I.grabNumberOfVisibleElements(dbaasPage.tabs.kubernetesClusterTab.requiredField);

    assert.ok(count === 2, `Count of error messages is: ${count} but should be 2`);
    I.fillField(dbaasPage.tabs.kubernetesClusterTab.kubernetesClusterNameInput, clusterName);
    I.fillField(dbaasPage.tabs.kubernetesClusterTab.kubeconfigFileInput, 'Kubernetes_Config_Test');
    I.dontSeeElement(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton);
  },
);

Scenario('PMM-T427 - Verify elements on PMM DBaaS page @dbaas',
  async ({ I, dbaasPage }) => {
    I.amOnPage(dbaasPage.url);
    I.waitForVisible(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButton, 30);
    I.waitForVisible(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButtonInTable, 30);
  });

Scenario('PMM-T547 PMM-T548  Verify user is able to view config of registered Kubernetes cluster on Kubernetes Cluster Page, ' +
 'PMM-T1130 - Verify warning about deleting an API key @dbaas',
  async ({ I, dbaasPage, dbaasAPI }) => {
    await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    I.amOnPage(dbaasPage.url);
    dbaasPage.checkCluster(clusterName, false);
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.actionsLocator(clusterName), 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.actionsLocator(clusterName));
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.viewClusterConfiguration, 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.viewClusterConfiguration);
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.modalContent, 30);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.copyToClipboardButton);
    I.click(dbaasPage.tabs.kubernetesClusterTab.copyToClipboardButton);
    I.waitForText(dbaasPage.configurationCopiedMessage, 30);
    const configuration = await I.grabTextFrom(dbaasPage.tabs.kubernetesClusterTab.clusterConfigurationText);

    assert.ok(configuration === process.env.kubeconfig_minikube, `The configuration shown is not equal to the expected Cluster configuration, ${configuration}`);
    // PMM-T1130
    I.amOnPage(dbaasPage.apiKeysUrl);
    I.waitForText(dbaasPage.apiKeysPage.apiKeysWarningText, 10, dbaasPage.apiKeysPage.apiKeysWarningLocator);
    await dbaasAPI.apiUnregisterCluster(clusterName);
  });

Scenario('Verify user is able to add same cluster config with different Name @dbaas',
  async ({ I, dbaasPage, dbaasAPI }) => {
    const clusterName1 = 'Kubernetes_Testing_Cluster_1';
    const clusterName2 = 'Kubernetes_Testing_Cluster_2';

    await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName1);
    await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName2);
    I.amOnPage(dbaasPage.url);
    dbaasPage.checkCluster(clusterName1, false);
    dbaasPage.checkCluster(clusterName2, false);
    await dbaasAPI.apiUnregisterCluster(clusterName1);
    await dbaasAPI.apiUnregisterCluster(clusterName2);
    I.refreshPage();
    dbaasPage.checkCluster(clusterName2, true);
    dbaasPage.checkCluster(clusterName1, true);
  });

Scenario('PMM-T728 Verify DB Cluster Tab Page Elements & Steps Background @dbaas',
  async ({ I, dbaasPage, dbaasAPI, settingsAPI }) => {
    await settingsAPI.changeSettings({ publicAddress: '' });
    if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
      await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    }

    I.amOnPage(dbaasPage.url);
    dbaasPage.checkCluster(clusterName, false);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterTab);
    I.waitForEnabled(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 10);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.monitoringWarningLocator, 30);
    I.waitForText(dbaasPage.monitoringWarningMessage, 30);
    I.seeElement(dbaasPage.tabs.dbClusterTab.basicOptions.fields.clusterNameField);
    I.seeElement(dbaasPage.tabs.dbClusterTab.basicOptions.fields.kubernetesClusterDropDown);
    I.seeElement(dbaasPage.tabs.dbClusterTab.basicOptions.fields.dbClusterDatabaseTypeField);
    I.seeElement(dbaasPage.tabs.dbClusterTab.optionsCountLocator(2));
    I.seeElement(dbaasPage.tabs.dbClusterTab.optionsCountLocator(1));
    I.click(dbaasPage.tabs.dbClusterTab.optionsCountLocator(2));
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.dbClusterTopologyFieldLabel);
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.nodesNumberField);
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.dbClusterExternalAccessCheckbox);
    I.dontSeeCheckboxIsChecked(
      dbaasPage.tabs.dbClusterTab.advancedOptions.fields.dbClusterExternalAccessCheckbox,
    );
    I.moveCursorTo(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.dbClusterExternalAccessTooltip);
    I.seeTextEquals('Allows external access to the database cluster',
      dbaasPage.tabs.dbClusterTab.advancedOptions.fields.dbClusterExternalAccessTooltipText);
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.dbClusterResourceFieldLabel);
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryField);
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuNumberFields);
    I.seeElement(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.diskSizeInputField);
    I.seeElement(dbaasPage.tabs.dbClusterTab.createClusterButton);
    await dbaasAPI.apiUnregisterCluster(clusterName);
  });

Scenario('PMM-T456 PMM-T490 Verify DB Cluster Steps Background @dbaas',
  async ({
    I, dbaasPage, dbaasAPI, adminPage,
  }) => {
    if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
      await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    }

    I.amOnPage(dbaasPage.url);
    dbaasPage.checkCluster(clusterName, false);
    I.dontSeeElement(adminPage.fields.timePickerMenu);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterTab);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.addDbClusterButton, 60);
    I.dontSeeElement(adminPage.fields.timePickerMenu);
    I.waitForEnabled(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 10);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.monitoringWarningLocator, 30);
    I.waitForText(dbaasPage.monitoringWarningMessage, 30);
    await adminPage.verifyBackgroundColor(dbaasPage.tabs.dbClusterTab.optionsCountLocator(1), 'rgb(235, 123, 24)');
    await adminPage.verifyBackgroundColor(dbaasPage.tabs.dbClusterTab.optionsCountLocator(2), 'rgb(142, 142, 142)');
    I.click(dbaasPage.tabs.dbClusterTab.optionsCountLocator(2));
    await adminPage.verifyBackgroundColor(dbaasPage.tabs.dbClusterTab.optionsCountLocator(1), 'rgb(209, 14, 92)');
    await adminPage.verifyBackgroundColor(dbaasPage.tabs.dbClusterTab.optionsCountLocator(2), 'rgb(235, 123, 24)');
    I.click(dbaasPage.tabs.dbClusterTab.optionsCountLocator(1));
    await adminPage.verifyBackgroundColor(dbaasPage.tabs.dbClusterTab.optionsCountLocator(2), 'rgb(26, 127, 75)');
    await adminPage.verifyBackgroundColor(dbaasPage.tabs.dbClusterTab.optionsCountLocator(1), 'rgb(235, 123, 24)');
    I.click(dbaasPage.tabs.dbClusterTab.optionsCountLocator(2));
    await dbaasAPI.apiUnregisterCluster(clusterName);
  });

Data(nameFields).Scenario('PMM-T456 Verify Create Cluster steps validation fields disabled/enabled + name input validation, PMM-T833 - Verify DB cluster name length @dbaas',
  async ({
    I, dbaasPage, dbaasAPI, adminPage, current, dbaasActionsPage,
  }) => {
    if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
      await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    }

    I.amOnPage(dbaasPage.url);
    dbaasPage.checkCluster(clusterName, false);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterTab);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.addDbClusterButton, 60);
    I.dontSeeElement(adminPage.fields.timePickerMenu);
    await dbaasActionsPage.createClusterBasicOptions(clusterName, 'a2345678901234567890', 'MySQL');
    I.dontSee(dbaasPage.dbclusterNameLimitError, dbaasPage.tabs.dbClusterTab.basicOptions.fields.clusterNameFieldErrorMessage);
    adminPage.customClearField(current.field);
    I.fillField(dbaasPage.tabs.dbClusterTab.basicOptions.fields.clusterNameField, 'a23456789012345678901');
    I.seeTextEquals(
      dbaasPage.dbclusterNameLimitError, dbaasPage.tabs.dbClusterTab.basicOptions.fields.clusterNameFieldErrorMessage,
    );
    I.waitForElement(dbaasPage.tabs.dbClusterTab.optionsCountLocator(2), 30);
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
    I.click(dbaasPage.tabs.dbClusterTab.optionsCountLocator(2));
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
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNode('Custom'));
    I.waitForEnabled(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryField, 3);
    I.waitForEnabled(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.diskSizeInputField, 3);
    I.waitForEnabled(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuNumberFields, 3);
    await dbaasAPI.apiUnregisterCluster(clusterName);
  });

Data(inputFields).Scenario('PMM-T456 Verify Create Cluster steps validation - field input validation @dbaas',
  async ({
    I, dbaasPage, dbaasAPI, adminPage, current, dbaasActionsPage,
  }) => {
    if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
      await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    }

    I.amOnPage(dbaasPage.url);
    dbaasPage.checkCluster(clusterName, false);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterTab);
    I.waitForVisible(dbaasPage.tabs.dbClusterTab.addDbClusterButton, 60);
    await dbaasActionsPage.createClusterBasicOptions(clusterName, 'dbcluster', 'MySQL');
    I.waitForElement(dbaasPage.tabs.dbClusterTab.optionsCountLocator(2), 30);
    I.click(dbaasPage.tabs.dbClusterTab.optionsCountLocator(2));
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNode('Custom'));
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
  });

Data(resourceFields).Scenario('PMM-T828 Verify the Configuration for Small, Medium, Large Resource @dbaas',
  async ({
    I, dbaasPage, dbaasAPI, current,
  }) => {
    if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
      await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    }

    await dbaasPage.waitForDbClusterTab(clusterName);
    I.waitForInvisible(dbaasPage.tabs.kubernetesClusterTab.disabledAddButton, 30);
    I.waitForEnabled(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 10);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.optionsCountLocator(2), 30);
    I.click(dbaasPage.tabs.dbClusterTab.optionsCountLocator(2));
    I.waitForVisible(
      dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNode(current.resourceType),
      30,
    );
    I.click(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.resourcesPerNode(current.resourceType));
    let value = await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.cpuNumberFields, 'value');

    await dbaasPage.validateResourcesField('cpu', current.resourceType, value);
    value = await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.memoryField, 'value');
    await dbaasPage.validateResourcesField('memory', current.resourceType, value);
    value = await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.advancedOptions.fields.diskSizeInputField, 'value');
    await dbaasPage.validateResourcesField('disk', current.resourceType, value);
  });

Scenario('PMM-T546 Verify Actions column on Kubernetes cluster page @dbaas',
  async ({ I, dbaasPage, dbaasAPI }) => {
    if (!await dbaasAPI.apiCheckRegisteredClusterExist(clusterName)) {
      await dbaasAPI.apiRegisterCluster(process.env.kubeconfig_minikube, clusterName);
    }

    I.amOnPage(dbaasPage.url);
    dbaasPage.checkCluster(clusterName, false);
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.actionsLocator(clusterName), 30);
    I.click(dbaasPage.tabs.kubernetesClusterTab.actionsLocator(clusterName));
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.viewClusterConfiguration, 30);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.manageVersions);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.viewClusterConfiguration);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.unregisterButton);
  });

Scenario(
  'PMM-T969 - Verify pmm-client logs when incorrect public address is set @dbaas',
  async ({ I, settingsAPI, dbaasAPI, dbaasPage, dbaasActionsPage }) => {
    const dbClusterName = dbaasPage.randomizeClusterName('dbcluster');
    const dbType = 'MySQL';
    const address = 'https://1.2.3.4';
    const logsText = `Registering pmm-agent on PMM Server...
Failed to register pmm-agent on PMM Server: Post "https://https:%2F%2F1.2.3.4/v1/management/Node/Register": dial tcp: lookup ${address}: no such host.
[u'pmm-agent', u'setup'] exited with 1.
Restarting [u'pmm-agent', u'setup'] in 5 seconds because PMM_AGENT_SIDECAR is enabled ...`;
  
    await settingsAPI.changeSettings({ publicAddress: address });
    await dbaasAPI.apiCreatePXCCluster(dbClusterName, clusterName);

    I.amOnPage(dbaasPage.url);
    dbaasPage.checkCluster(clusterName, false);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterTab);
    I.waitForText('Processing', 30, dbaasPage.tabs.dbClusterTab.fields.progressBarContent);
    await dbaasAPI.waitForDBClusterState(dbClusterName, clusterName, dbType, 'DB_CLUSTER_STATE_READY');
    await dbaasActionsPage.showClusterLogs();
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.dbClusterLogs.expandAllLogsButton, 30);
    I.click(dbaasPage.tabs.dbClusterTab.fields.dbClusterLogs.expandAllLogsButton);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.dbClusterLogs.expandedContainersLogsSection, 30);
    I.waitForText('Restarting [u\'pmm-agent\', u\'setup\'] in 5 seconds because PMM_AGENT_SIDECAR is enabled ...',
      120, dbaasPage.tabs.dbClusterTab.fields.dbClusterLogs.expandedContainersLogsSection);

    const pmmClientLogsText = await I.grabTextFrom(
      dbaasPage.tabs.dbClusterTab.fields.dbClusterLogs.expandedContainersLogsSection,
    );

    assert.ok(pmmClientLogsText.includes(logsText), `Pmm-client logs must contain text: ${logsText}`);
  });
