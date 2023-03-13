const {
  I, dbaasAPI, dbaasActionsPage, dbaasManageVersionPage, dashboardPage, qanPage, qanFilters, qanOverview, inventoryAPI,
} = inject();
const assert = require('assert');
const faker = require('faker');

module.exports = {
  url: 'graph/dbaas',
  apiKeysUrl: 'graph/org/apikeys',

  apiKeysPage: {
    apiKeysWarningText: 'If a resource (for example, DB cluster) uses an API key, deleting that API key might affect the functionality of that resource.',
    apiKeysWarningLocator: '$warning-block',
    apiKeysTable: '.page-body',
  },
  disabledDbaaSMessage: {
    textMessage: 'DBaaS is disabled. You can enable it in PMM Settings.',
    settingsLinkLocator: '$settings-link',
    emptyBlock: '$empty-block',
  },
  addedAlertMessage: 'Cluster was successfully registered',
  confirmDeleteText: 'Are you sure that you want to unregister this cluster?',
  deletedAlertMessage: 'Cluster successfully unregistered',
  failedUnregisterCluster: (clusterName) => `Kubernetes cluster ${clusterName} has database clusters`,
  configurationCopiedMessage: 'Copied',
  monitoringWarningMessage: `This will also set "Public Address" as ${process.env.VM_IP}.`,
  requiredFieldError: 'Required field',
  valueGreatThanErrorText: (value) => `Value should be greater or equal to ${value}`,
  dbclusterNameError: 'Should start with a letter, may only contain lower case, number, dash and end with an alphanumeric character',
  dbclusterNameLimitError: 'Must contain at most 20 characters',
  tooltips: {
    technicalPreview: {
      tooltipText: locate('//div[@data-popper-escaped]//span'),
      tooltipReadMoreLink: locate('//div[@data-popper-escaped]//a'),
      iconLocator: locate('//h1[text()="This feature is in Technical Preview stage"]').find('div[class$="-Icon"]').as('Technical preview tooltip'),
      text: 'Read more about feature status here',
      link: 'https://per.co.na/pmm-feature-status',
    },
    clusterType: {
      tooltipText: locate('//div[@data-popper-escaped]'),
      iconLocator: locate('$eks-info-icon').as('EKS info tooltip'),
      text: 'If using Amazon EKS and kubeconfig does not contain AWS access key ID and AWS secret access key please provide them below',
      link: false,
    },
    awsAccessKeyId: {
      tooltipText: locate('//div[@data-popper-escaped]//span'),
      tooltipReadMoreLink: locate('//div[@data-popper-escaped]//a'),
      iconLocator: locate('//div[label[@data-testid="awsAccessKeyID-field-label"]]').find('div[class$="-Icon"]').as('AWS Access Key ID tooltip'),
      text: 'AWS Access Key ID of the root user or an IAM user with access to the EKS cluster',
      link: 'https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html',
    },
    awsSecretAccessKey: {
      tooltipText: locate('//div[@data-popper-escaped]//span'),
      tooltipReadMoreLink: locate('//div[@data-popper-escaped]//a'),
      iconLocator: locate('//div[label[@data-testid="awsSecretAccessKey-field-label"]]').find('div[class$="-Icon"]').as('AWS Secret Access Key tooltip'),
      text: 'AWS Secret Access Key of the root user or an IAM user with access to the EKS cluster',
      link: 'https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html',
    },
    expose: {
      tooltipText: locate('//div[@data-popper-escaped]//span'),
      iconLocator: locate('//div[label[@data-testid="expose-field-label"]]').find('div[class$="-Icon"]').as('Expose tooltip'),
      text: 'You will make this database cluster available to connect from the internet. To limit access you need to specify source ranges',
    },
  },
  numberOfNodesError: 'Only 1, 3 or more nodes allowed',
  tabs: {
    kubernetesClusterTab: {
      kubernetesClusterTabButton: 'a[aria-label="Tab Kubernetes Cluster"]',
      addKubernetesClusterButton: '$kubernetes-new-cluster-button',
      addKubernetesClusterButtonInTable: '//div[@data-testid="table-no-data"]//span[contains(text(), "Register new Kubernetes Cluster")]',
      actionsLocator: (clusterName) => `//td[contains(text(), "${clusterName}")]//parent::tr//button[@data-testid="dropdown-menu-toggle"]`,
      cancelButton: '$k8s-cluster-cancel-button',
      clusterConfigurationText: locate('$pmm-overlay-wrapper').find('pre'),
      copyToClipboardButton: '//span[contains(text(), "Copy to clipboard")]',
      disabledRegisterButton: '//button[@data-testid="k8s-cluster-submit-button" and @disabled]',
      registerButton: '$k8s-cluster-submit-button',
      forceUnreigsterCheckBox: locate('$force-field-container').find('span').at(1),
      kubeconfigFileInput: '//textarea[@data-testid="kubeConfig-textarea-input"]',
      kubernetesClusterNameInput: '$name-text-input',
      modalWindow: '$modal-body',
      modalCloseButton: '$modal-close-button',
      modalContent: '$modal-content',
      modalContentText: locate('$modal-content').find('h4'),
      proceedButton: '$delete-kubernetes-button',
      requiredField: '//div[contains(text(), "Required field")]',
      tableLoading: '$table-loading',
      unregisterButton: locate('$dropdown-menu-menu').find('span').at(1),
      viewClusterConfiguration: locate('$dropdown-menu-menu').find('span').at(2),
      manageVersions: locate('$dropdown-menu-menu').find('span').at(3),
      registerNewClusterHeader: locate('h2').withText('Register new Kubernetes Cluster'),
      genericClusterLabel: locate('label').withText('Generic'),
      genericEksClusterRadio: '$isEKS-radio-button',
      eksClusterLabel: locate('label').withText('Amazon Elastic Kubernetes'),
      pasteFromClipboardButton: '$kubernetes-paste-from-clipboard-button',
      awsAccessKeyInput: '$awsAccessKeyID-text-input',
      awsSecretKeyInput: '$awsSecretAccessKey-password-input',
      spinner: '$Spinner',
      freeClusterPromo: '$pmm-server-promote-portal-k8s-cluster-message',
    },
    dbClusterTab: {
      defaultPassword: '***************',
      addDbClusterButton: locate('$table-no-data').find('button'),
      dbClusterAddButtonTop: '$dbcluster-add-cluster-button',
      createClusterButton: '$db-cluster-submit-button',
      editClusterButtonDisabled: '//button[@data-testid="db-cluster-submit-button" and @disabled]//span[text()="Edit"]',
      confirmUpdateButton: '$confirm-update-dbcluster-button',
      dbClusterTab: 'a[aria-label="Tab DB Cluster"]',
      monitoringWarningLocator: '$pmm-server-url-warning',
      advancedOptionsButton: '$dbCluster-advanced-settings',
      deleteDbClusterConfirmationText: (dbClusterName, clusterName, dbType) => `Are you sure that you want to delete ${dbType} cluster ${dbClusterName} from Kubernetes cluster ${clusterName} ?`,
      basicOptions: {
        fields: {
          allBasicOptions: '$dbcluster-basic-options-step',
          clusterNameField: '$name-text-input',
          clusterNameFieldErrorMessage: '$name-field-error-message',
          dbClusterDatabaseTypeField: '$dbcluster-database-type-field',
          dbClusterDatabaseTypeInputField: locate('$dbcluster-database-type-field').find('input'),
          dbClusterDatabaseTypeFieldSelect: (dbtype) => `//div[@aria-label='Select option']//span[contains(@text, ${dbtype})]`,
          dbClusterDatabaseTypeFieldErrorMessage: '$select-field-error-message',
          dbClusterDatabaseVersionField: '$dbcluster-database-version-field',
          dbClusterDatabaseVersion: (version) => `//span[text()='${version}']`,
          dbClusterDatabaseVersionSelect: (version) => locate('div').withAttr({ 'aria-label': 'Select option' }).find('span').withText(`${version}`),
          defaultDbVersionValue: (version) => locate(
            '$dbcluster-database-version-field',
          )
            .find('div')
            .withText(version),
          kubernetesClusterDropDown: '$dbcluster-kubernetes-cluster-field',
          kubernetesClusterDropDownSelect: (clusterName) => `//div[@aria-label='Select option']//span[contains(@text, ${clusterName})]`,
          kubernetesClusterErrorMessage: '$select-field-error-message',
        },
      },
      advancedOptions: {
        fields: {
          cpuFieldErrorMessage: '$cpu-field-error-message',
          cpuNumberFields: '$cpu-number-input',
          resourcesPerNodeLabel: '$resources-field-label',
          resourcesPerNodeSelect: locate('$resources-field-container').find('div').at(4).as('Resources per Node Select'),
          resourcesPerNodesOption: (option) => `$${option}-select-option`,
          dbClusterResourcesBarMemory: '$dbcluster-resources-bar-memory',
          dbClusterResourcesBarCpu: '$dbcluster-resources-bar-cpu',
          diskFieldErrorMessage: '$disk-field-error-message',
          diskSizeInputField: '$disk-number-input',
          memoryField: '$memory-number-input',
          memoryFieldErrorMessage: '$memory-field-error-message',
          nodesFieldErrorMessage: '$nodes-field-error-message',
          nodesNumberField: '$nodes-number-input',
          resourceBarCPU: '$dbcluster-resources-bar-cpu',
          resourceBarMemory: '$dbcluster-resources-bar-memory',
          resourceBarDisk: '$dbcluster-resources-bar-disk',
          resourceBarInsufficientResources: (section) => locate(section)
            .find('$resources-bar-insufficient-resources'),
          resourceBarResourceIndication: (section) => locate(section)
            .find('$resources-bar')
            .find('div')
            .at(1),
          advancedSettingsLabel: locate('legend').withText('Advanced Settings'),
        },
      },
      dbConfigurations: {  
        configurationsHeader: (dbType) => locate('legend').withText(`${dbType} Configurations`),
        configurationLabel: (dbType) => locate('$configuration-field-label').withText(dbType),
        storageClassLabel: '$storageClass-field-label',
      },
      networkAndSecurity: {
        networkAndSecurityHeader: locate('legend').withText('Network and Security'),
        exposeLabel: '$expose-field-label',
        exposeCheckbox: '$expose-checkbox-input',
        exposeTooltipText: locate('div').withChild('.tooltip-arrow'),
        exposeTooltip: locate('$expose-field-container').find('div').at(3).as('Expose tooltip'),
        internetFacingLabel: '$internetFacing-field-label',
        internetFacingCheckbox: '$internetFacing-checkbox-input',
        sourceRangesLabel: locate('label').withText('Source Range'),
        addNewSourceRangeButton: locate('button').find('span').withText('Add new').as('Add Source Range button'),
        sourceRangeInput: locate('input').withAttr({ placeholder: '181.170.213.40/32' }).as('Source Range input'),
        deleteSourceRangeButton: (order) => `$deleteButton-${order}`,
        disabled: {
          exposeCheckboxDisabled: '//input[@data-testid="expose-checkbox-input" and @disabled]',
          internetFacingCheckboxDisabled: '//input[@data-testid="internetFacing-checkbox-input" and @disabled]',
          addNewSourceRangeButtonDisabled: `//button[(@disabled)]//span[contains(., 'Add new')]`,
        },
      },
      fields: {
        clusterDetailHeaders: ['Name', 'Database', 'Connection', 'DB Cluster Parameters', 'Cluster Status', 'Actions'],
        clusterAction: (action) => `//div[@data-testid='dropdown-menu-menu']//span[contains(text(), '${action}')]`,
        clusterConnection: {
          dbHost: '$cluster-connection-host',
          dbPort: '$cluster-connection-port',
          dbUsername: '$cluster-connection-username',
          dbPassword: '$cluster-connection-password',
          showPasswordButton: '$show-password-button',
        },
        clusterParameters: {
          clusterParametersClusterName: '$cluster-parameters-cluster-name',
          clusterParametersCPU: '$cluster-parameters-cpu',
          clusterParametersMemory: '$cluster-parameters-memory',
          clusterParametersDisk: '$cluster-parameters-disk',
        },
        clusterDetailProperty: (parameter) => locate(parameter).find('span').at(2),
        clusterParametersFailedValue: '$cluster-parameters-failed',
        clusterConnectionColumn: locate('$table-row').find('td').at(3),
        clusterConnectionLoading: '$cluster-connection-loading',
        clusterDBPasswordValue: locate('$cluster-connection-password').find('span').at(2),
        clusterDatabaseType: locate('$table-row').find('td').at(2),
        clusterName: locate('$table-row').find('td').at(1).find('span'),
        clusterSummaryDashboard: locate('$table-row').find('td').at(1).find('a'),
        clusterStatusActive: '$cluster-status-active',
        clusterStatusPaused: '$cluster-status-suspended',
        clusterStatusDeleting: '$cluster-status-deleting',
        clusterStatusUpdating: '$cluster-status-updating',
        clusterTableHeader: locate('$table-header').find('th'),
        clusterTableRow: (dbClusterName) => locate('$table-row').withText(dbClusterName),
        clusterActionsMenu: (dbclusterName) => `//*[@data-testid="table-row" and contains(.//span, '${dbclusterName}')]//*[@data-testid="dropdown-menu-toggle"]`,
        deleteDBClusterButton: '$delete-dbcluster-button',
        dbClusterLogs: {
          dbClusterLogsAction: '$dbcluster-logs-actions',
          closeButton: '$modal-close-button',
          modalHeader: '$modal-header',
          podLogsHeader: locate('$dbcluster-pod-logs').at(1),
          expandAllLogsButton: locate('span').withText('Expand all'),
          refreshLogsButton: locate('$dbcluster-logs-actions').find('button').at(2),
          expandedContainersLogsSection: locate('$dbcluster-logs').find('pre'),
          expandedEventsLogsSection: '$dbcluster-pod-events',
          refreshLogsSpinner: '$dbcluster-logs-loading',
          collapseAllLogsButton: locate('span').withText('Collapse all'),
        },
        cancelDeleteDBCluster: '$cancel-delete-dbcluster-button',
        progressBarSteps: '$progress-bar-steps',
        progressBarContent: (dbclusterName) => `//*[@data-testid="table-row" and contains(.//span, '${dbclusterName}')]//*[@data-testid="progress-bar-message"]`,
        editDbClusterHeader: locate('h2').withText('Edit DB Cluster'),
      },
    },
  },
  clusterConfiguration: {
    Small: {
      memory: '2',
      cpu: '1',
      disk: '25',
    },
    Medium: {
      memory: '8',
      cpu: '4',
      disk: '100',
    },
    Large: {
      memory: '32',
      cpu: '8',
      disk: '500',
    },
    Custom: {
      memory: '2',
      cpu: '1',
      disk: '25',
    },
  },
  clusterDashboardUrls: {
    pxcDashboard: (dbClusterName) => `/graph/d/pxc-cluster-summary/pxc-galera-cluster-summary?var-cluster=${dbClusterName}-pxc`,
    psmdbDashboard: (dbClusterName) => `/graph/d/mongodb-cluster-summary/mongodb-cluster-summary?var-cluster=${dbClusterName}`,
  },

  randomizeClusterName(clusterName) {
    const stringLength = 6;
    const randomString = faker.random.alphaNumeric(stringLength);

    return `${clusterName}-${randomString}`;
  },

  checkCluster(clusterName, deleted) {
    const clusterLocator = `//td[contains(text(), '${clusterName}')]`;

    if (deleted) {
      I.refreshPage();
      I.waitForVisible(this.tabs.kubernetesClusterTab.freeClusterPromo);
      I.dontSeeElement(clusterLocator);
    } else {
      I.waitForVisible(clusterLocator, 30);
    }
  },

  seeErrorForAddedCluster(clusterName) {
    const message = `Kubernetes Cluster with Name "${clusterName}" already exists.`;

    I.waitForText(message, 10);
  },

  seeErrorForAddedDBCluster(dbClusterName) {
    const message = `Cluster '${dbClusterName}' already exists`;

    I.waitForText(message, 10);
  },

  registerKubernetesCluster(clusterName, config) {
    I.click(this.tabs.kubernetesClusterTab.addKubernetesClusterButton);
    I.usePlaywrightTo('Fill config to the input', async ({ page }) => {
      await page.type(this.tabs.kubernetesClusterTab.kubeconfigFileInput, config, { timeout: 120000 });
    });
    I.click(this.tabs.kubernetesClusterTab.registerButton);
  },

  unregisterCluster(clusterName, force = false) {
    I.waitForVisible(this.tabs.kubernetesClusterTab.actionsLocator(clusterName), 30);
    I.click(this.tabs.kubernetesClusterTab.actionsLocator(clusterName));
    I.waitForElement(this.tabs.kubernetesClusterTab.unregisterButton, 30);
    I.click(this.tabs.kubernetesClusterTab.unregisterButton);
    I.waitForText(this.confirmDeleteText, 10);
    if (force) {
      I.waitForElement(this.tabs.kubernetesClusterTab.forceUnreigsterCheckBox, 30);
      I.click(this.tabs.kubernetesClusterTab.forceUnreigsterCheckBox);
    }

    I.click(this.tabs.kubernetesClusterTab.proceedButton);
  },

  verifyInputValidationMessages(field, value, errorField, message) {
    I.fillField(field, value);
    I.seeTextEquals(message, errorField);
  },

  async verifyConnectionAndDbClusterParameters(section) {
    for (const element in section) {
      I.waitForElement(section[element], 30);
      I.seeElement(section[element]);
      if (element !== 'showPasswordButton') {
        I.seeElement(this.tabs.dbClusterTab.fields.clusterDetailProperty(section[element]));
      }
    }
  },

  async verifyElementsInSection(section) {
    for (const element in section) {
      I.seeElement(section[element]);
    }
  },

  async postClusterCreationValidation(dbClusterName, k8sClusterName, clusterDBType = 'MySQL') {
    const dbaasPage = this;

    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName), 60);
    I.forceClick(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName));
    await dbaasActionsPage.checkActionPossible('Delete', true, dbClusterName);
    await dbaasActionsPage.checkActionPossible('Edit', false, dbClusterName);
    await dbaasActionsPage.checkActionPossible('Restart', false, dbClusterName);
    await dbaasActionsPage.checkActionPossible('Resume', false, dbClusterName);
    I.forceClick(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName));
    await dbaasAPI.waitForDBClusterState(dbClusterName, k8sClusterName, clusterDBType, 'DB_CLUSTER_STATE_READY');
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive, 120);
    I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterStatusActive);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterConnection.showPasswordButton, 30);
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterConnection.showPasswordButton);
    I.forceClick(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName));
    await dbaasActionsPage.checkActionPossible('Delete', true, dbClusterName);
    await dbaasActionsPage.checkActionPossible('Edit', true, dbClusterName);
    await dbaasActionsPage.checkActionPossible('Restart', true, dbClusterName);
    await dbaasActionsPage.checkActionPossible('Suspend', true, dbClusterName);
    I.forceClick(dbaasPage.tabs.dbClusterTab.fields.clusterActionsMenu(dbClusterName));
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterConnection.showPasswordButton);
  },

  async waitForDbClusterTab(clusterName) {
    const dbaasPage = this;

    I.amOnPage(dbaasPage.url);
    dbaasPage.checkCluster(clusterName, false);
    I.click(dbaasPage.tabs.dbClusterTab.dbClusterTab);
    I.waitForElement(dbaasPage.tabs.dbClusterTab.dbClusterAddButtonTop, 30);
    I.waitForDetached(dbaasManageVersionPage.loader, 30);
  },

  async waitForKubernetesClusterTab(k8sClusterName) {
    const dbaasPage = this;

    I.amOnPage(dbaasPage.url);
    dbaasPage.checkCluster(k8sClusterName, false);
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButton, 30);
  },

  async goToKubernetesClusterTab() {
    const dbaasPage = this;

    I.waitForVisible(dbaasPage.tabs.kubernetesClusterTab.kubernetesClusterTabButton);
    I.click(dbaasPage.tabs.kubernetesClusterTab.kubernetesClusterTabButton);
    I.seeInCurrentUrl('graph/dbaas/kubernetes');
  },

  async validateClusterDetail(dbsClusterName, k8sClusterName, configuration, link) {
    const dbaasPage = this;

    I.waitForElement(dbaasPage.tabs.dbClusterTab.fields.clusterTableHeader, 60);
    const dbClusterDetailHeaderCount = await I.grabNumberOfVisibleElements(
      dbaasPage.tabs.dbClusterTab.fields.clusterTableHeader,
    );

    assert.ok(
      dbClusterDetailHeaderCount === 6,
      `Total DB Cluster Details should be 6, but some details missing found only ${dbClusterDetailHeaderCount}`,
    );
    const dbClusterDetailHeaders = await I.grabTextFromAll(
      dbaasPage.tabs.dbClusterTab.fields.clusterTableHeader,
    );

    assert.deepEqual(dbClusterDetailHeaders, dbaasPage.tabs.dbClusterTab.fields.clusterDetailHeaders);

    await dbaasPage.validateClusterParameter(dbaasPage.tabs.dbClusterTab.fields.clusterName, 'DB Cluster Name', dbsClusterName);
    I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterSummaryDashboard);
    const dashboardLinkAttribute = await I.grabAttributeFrom(dbaasPage.tabs.dbClusterTab.fields.clusterSummaryDashboard, 'href');

    assert.ok(
      dashboardLinkAttribute.includes(link),
      `The Cluster Dashboard Redirection Link is wrong found ${dashboardLinkAttribute}`,
    );
    I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterDatabaseType);
    const clusterDBType = await I.grabTextFrom(dbaasPage.tabs.dbClusterTab.fields.clusterDatabaseType);

    assert.ok(
      clusterDBType.includes(configuration.dbType),
      `Expected DB Type was ${configuration.dbType}, but found ${clusterDBType}`,
    );
    await dbaasPage.verifyConnectionAndDbClusterParameters(dbaasPage.tabs.dbClusterTab.fields.clusterParameters);
    await dbaasPage.verifyConnectionAndDbClusterParameters(dbaasPage.tabs.dbClusterTab.fields.clusterConnection);
    I.seeElement(dbaasPage.tabs.dbClusterTab.fields.clusterConnection.showPasswordButton);
    await dbaasPage.validateClusterParameter(dbaasPage.tabs.dbClusterTab.fields.clusterDBPasswordValue, 'Password', dbaasPage.tabs.dbClusterTab.defaultPassword);
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterConnection.showPasswordButton);
    const passwordValue = await I.grabTextFrom(dbaasPage.tabs.dbClusterTab.fields.clusterDBPasswordValue);

    assert.ok(
      passwordValue !== dbaasPage.tabs.dbClusterTab.defaultPassword,
      `Expected the Show Password to show cluster password but found ${passwordValue}`,
    );
    I.click(dbaasPage.tabs.dbClusterTab.fields.clusterConnection.showPasswordButton);
    await dbaasPage.validateClusterParameter(dbaasPage.tabs.dbClusterTab.fields.clusterDBPasswordValue, 'Password', dbaasPage.tabs.dbClusterTab.defaultPassword);
    await dbaasPage.validateClusterParameter(dbaasPage.tabs.dbClusterTab.fields.clusterDetailProperty(dbaasPage.tabs.dbClusterTab.fields.clusterParameters.clusterParametersClusterName), 'k8s Name', k8sClusterName);
    await dbaasPage.validateClusterParameter(dbaasPage.tabs.dbClusterTab.fields.clusterDetailProperty(dbaasPage.tabs.dbClusterTab.fields.clusterParameters.clusterParametersCPU), 'Cluster CPU', configuration.cpu);
    await dbaasPage.validateClusterParameter(dbaasPage.tabs.dbClusterTab.fields.clusterDetailProperty(dbaasPage.tabs.dbClusterTab.fields.clusterParameters.clusterParametersMemory), 'Memory', configuration.memory);
    await dbaasPage.validateClusterParameter(dbaasPage.tabs.dbClusterTab.fields.clusterDetailProperty(dbaasPage.tabs.dbClusterTab.fields.clusterParameters.clusterParametersDisk), 'Disk', configuration.disk);
  },

  async validateClusterParameter(parameter, type, value) {
    const parameterDisplayed = await I.grabTextFrom(parameter);

    assert.ok(
      parameterDisplayed === value,
      `Expected the k8s Cluster ${type} to show ${value} but found ${parameterDisplayed}`,
    );
  },

  async validateResourcesField(field, resourcePerNode, value) {
    assert.ok(
      this.clusterConfiguration[resourcePerNode][field] === value,
      `Expected Resource field ${field} to have ${this.clusterConfiguration[resourcePerNode][field]} but found ${value}`,
    );
  },

  async verifyLogPopup(numberOfElementsInLogSection, dbClusterName) {
    await dbaasActionsPage.showClusterLogs(dbClusterName);
    I.waitForElement(this.tabs.dbClusterTab.fields.dbClusterLogs.expandAllLogsButton);
    I.seeTextEquals('Expand all', this.tabs.dbClusterTab.fields.dbClusterLogs.expandAllLogsButton);
    I.click(this.tabs.dbClusterTab.fields.dbClusterLogs.expandAllLogsButton);
    I.seeTextEquals('Collapse all', this.tabs.dbClusterTab.fields.dbClusterLogs.collapseAllLogsButton);
    let numberOfExpanded = await I.grabNumberOfVisibleElements(
      this.tabs.dbClusterTab.fields.dbClusterLogs.expandedContainersLogsSection,
    );

    assert.ok(numberOfExpanded === numberOfElementsInLogSection, `Number of grabbed elements is: ${numberOfExpanded}`);
    I.click(this.tabs.dbClusterTab.fields.dbClusterLogs.collapseAllLogsButton);
    I.dontSeeElement(this.tabs.dbClusterTab.fields.dbClusterLogs.expandedContainersLogsSection);
    I.dontSeeElement(this.tabs.dbClusterTab.fields.dbClusterLogs.expandedEventsLogsSection);
    I.seeTextEquals('Expand all', this.tabs.dbClusterTab.fields.dbClusterLogs.expandAllLogsButton);
    I.waitForElement(this.tabs.dbClusterTab.fields.dbClusterLogs.refreshLogsButton);
    I.click(this.tabs.dbClusterTab.fields.dbClusterLogs.refreshLogsButton);
    //I.waitForElement(this.tabs.dbClusterTab.fields.dbClusterLogs.refreshLogsSpinner);
    I.waitForElement(this.tabs.dbClusterTab.fields.dbClusterLogs.podLogsHeader);
    I.click(this.tabs.dbClusterTab.fields.dbClusterLogs.podLogsHeader);
    numberOfExpanded = await I.grabNumberOfVisibleElements(
      this.tabs.dbClusterTab.fields.dbClusterLogs.expandedEventsLogsSection,
    );
    assert.ok(numberOfExpanded === 1, `Number of grabbed elements is: ${numberOfExpanded}`);
    I.click(this.tabs.dbClusterTab.fields.dbClusterLogs.closeButton);
    I.dontSeeElement(this.tabs.dbClusterTab.fields.dbClusterLogs.modalHeader);
  },

  async pxcClusterMetricCheck(dbclusterName, serviceName, nodeName, haproxynodeName) {
    await dashboardPage.genericDashboardLoadForDbaaSClusters(`${dashboardPage.mysqlPXCGaleraNodeSummaryDashboard.url}?&var-service_name=${serviceName}`, 'Last 30 minutes', 4, 0, 3);
    await dashboardPage.genericDashboardLoadForDbaaSClusters(`graph/d/haproxy-instance-summary/haproxy-instance-summary?orgId=1&refresh=1m&var-service_name=${haproxynodeName}`, 'Last 30 minutes', 4, 0, 3);
    // eslint-disable-next-line no-inline-comments
    await dashboardPage.genericDashboardLoadForDbaaSClusters(`${dashboardPage.mysqlInstanceSummaryDashboard.url}&var-service_name=${serviceName}`, 'Last 30 minutes', 4, 1, 5); //FIXME: Expected with N/A should be 0 after PMM-10308 is fixed
    await dashboardPage.genericDashboardLoadForDbaaSClusters(`${dashboardPage.nodeSummaryDashboard.url}?&var-node_name=${nodeName}`, 'Last 30 minutes', 4, 0, 1);
  },
  async psmdbClusterMetricCheck(dbclusterName, serviceName, nodeName, replSet) {
    await dashboardPage.genericDashboardLoadForDbaaSClusters(`graph/d/mongodb-wiredtiger/mongodb-wiredtiger-details?orgId=1&refresh=1m&var-service_name=${serviceName}`, 'Last 30 minutes', 4, 6, 2);
    await dashboardPage.genericDashboardLoadForDbaaSClusters(`${dashboardPage.mongodbOverviewDashboard.url}?&var-service_name=${serviceName}`, 'Last 30 minutes', 4, 3, 1);
    await dashboardPage.genericDashboardLoadForDbaaSClusters(`graph/d/mongodb-replicaset-summary/mongodb-replset-summary?orgId=1&refresh=1m&var-service_name=${serviceName}&var-replset=${replSet}&var-cluster=${dbclusterName}`, 'Last 30 minutes', 4, 0, 1);
    await dashboardPage.genericDashboardLoadForDbaaSClusters(`${dashboardPage.nodeSummaryDashboard.url}?&var-node_name=${nodeName}`, 'Last 30 minutes', 4, 0, 1);
  },

  async dbaasQANCheck(dbclusterName, nodeName, serviceName) {
    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-3h' }));
    qanOverview.waitForOverviewLoaded();
    qanFilters.checkFilterExistInSection('Node Name', `${nodeName}`);
    qanFilters.checkFilterExistInSection('Service Name', `${serviceName}`);
    qanOverview.waitForOverviewLoaded();
  },

  async dbClusterAgentStatusCheck(dbClusterName, serviceName, serviceType) {
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName(serviceType, serviceName);

    await inventoryAPI.waitForRunningState(service_id);
  },

  async apiKeyCheck(clusterName, dbClusterName, dbClusterType, keyExists) {
    const dbaasPage = this;

    I.amOnPage(dbaasPage.apiKeysUrl);
    I.waitForElement(dbaasPage.apiKeysPage.apiKeysTable);

    if (keyExists) {
      I.waitForText(`${dbClusterType}-${clusterName}-${dbClusterName}`, 10, dbaasPage.apiKeysPage.apiKeysTable);
    } else {
      I.dontSee(`${dbClusterType}-${dbClusterName}`, dbaasPage.apiKeysPage.apiKeysTable);
    }
  },

  async verifySourceRangeCount(count) {
    let sourceRange = await I.grabNumberOfVisibleElements(this.tabs.dbClusterTab.networkAndSecurity.sourceRangeInput);

    assert.ok(sourceRange === count, `There should be ${count} Source Range Inputs but found ${sourceRange}`);
  },
};
