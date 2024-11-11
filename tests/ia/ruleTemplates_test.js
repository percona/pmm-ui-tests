const assert = require('assert');
const YAML = require('yaml');
const page = require('./pages/ruleTemplatesPage');

const templates = new DataTable(['path', 'error']);
const units = new DataTable(['unit', 'range']);

units.add(['%', '[0, 100]']);
units.add(['s', '[0, 100]']);
units.add(['*', '[0, 100]']);
units.add(['%', '']);

templates.add([page.ruleTemplate.paths.yaml, null]);
templates.add([page.ruleTemplate.paths.yml, null]);
templates.add([page.ruleTemplate.paths.txt, page.messages.failedToParse]);
templates.add(['tests/ia/templates/customParam.yml', null]);
templates.add(['tests/ia/templates/undefinedParam.yml',
  'failed to fill expression placeholders: template: :4:5: executing "" at <.threshold>: map has no entry for key "threshold".']);
templates.add(['tests/ia/templates/specialCharInParam.yml',
  'failed to parse expression: template: :4: bad character U+0040 \'@\'.']);
templates.add(['tests/ia/templates/spaceInParam.yml',
  'failed to parse expression: template: :4: function "old" not defined.']);

Feature('IA: Alert rule templates').retry(1);

Before(async ({
  I, settingsAPI, templatesAPI, rulesAPI,
}) => {
  await I.Authorize();
  await settingsAPI.apiEnableIA();
  await rulesAPI.removeAllAlertRules();
  await templatesAPI.clearAllTemplates();
});

Before(async ({ templatesAPI }) => {
  await templatesAPI.clearAllTemplates();
});

// TODO: Unskip after we bring back built-in templates
Scenario.skip(
  'PMM-T510 Verify built-in rule templates are non-editable @alerting-fb @grafana-pr',
  async ({ I, ruleTemplatesPage }) => {
    const editButton = ruleTemplatesPage.buttons
      .editButtonBySource(ruleTemplatesPage.templateSources.builtin);
    const deleteButton = ruleTemplatesPage.buttons
      .deleteButtonBySource(ruleTemplatesPage.templateSources.builtin);

    ruleTemplatesPage.openRuleTemplatesTab();
    I.waitForVisible(editButton, 30);
    I.seeElementsDisabled(editButton);
    I.seeElementsDisabled(deleteButton);
  },
);

Scenario(
  'Verify rule templates list elements @alerting-fb @grafana-pr',
  async ({ I, ruleTemplatesPage, templatesAPI }) => {
    const path = ruleTemplatesPage.ruleTemplate.paths.yaml;

    ruleTemplatesPage.openRuleTemplatesTab();
    I.waitForVisible(ruleTemplatesPage.elements.columnHeaderLocator('Name'), 30);
    I.waitForVisible(ruleTemplatesPage.elements.columnHeaderLocator('Source'), 30);
    I.waitForVisible(ruleTemplatesPage.elements.columnHeaderLocator('Actions'), 30);

    await templatesAPI.createRuleTemplate(path);
    I.refreshPage();

    I.waitForVisible(ruleTemplatesPage.elements.columnHeaderLocator('Name'), 30);
    I.waitForVisible(ruleTemplatesPage.elements.columnHeaderLocator('Source'), 30);
    // I.waitForVisible(ruleTemplatesPage.elements.columnHeaderLocator('Created'), 30);
    I.waitForVisible(ruleTemplatesPage.elements.columnHeaderLocator('Actions'), 30);
    const templateName = await I.grabTextFromAll(ruleTemplatesPage.elements.templateName);

    templateName.forEach((name) => {
      assert.ok(name.length > 0, 'Rule Template name should not be empty');
    });
    I.seeElement(ruleTemplatesPage.buttons.openAddTemplateModal);
  },
);

Scenario(
  'Add rule template modal elements @alerting-fb @grafana-pr',
  async ({ I, ruleTemplatesPage }) => {
    ruleTemplatesPage.openRuleTemplatesTab();
    I.click(ruleTemplatesPage.buttons.openAddTemplateModal);
    I.see(ruleTemplatesPage.messages.modalHeaderText, ruleTemplatesPage.elements.modalHeader);
    I.seeElement(ruleTemplatesPage.buttons.closeModal);
    I.seeElement(ruleTemplatesPage.buttons.uploadFile);
    I.seeElement(ruleTemplatesPage.buttons.addTemplate);
    I.seeElement(ruleTemplatesPage.buttons.cancelAdding);
  },
);

// nightly candidate
Data(units)
  .Scenario(
    'PMM-T500 PMM-T595 PMM-T596 Add rule templates with different units, empty range @alerting-fb',
    async ({
      I, ruleTemplatesPage, templatesAPI, current,
    }) => {
      const [templateName, fileContent, id] = await ruleTemplatesPage.ruleTemplate
        .templateNameAndContent(ruleTemplatesPage.ruleTemplate.inputFilePath);
      const editButton = ruleTemplatesPage.buttons
        .editButtonByName(templateName);
      const deleteButton = ruleTemplatesPage.buttons
        .deleteButtonByName(templateName);

      const newFileContent = fileContent
        .replace('unit: \'%\'', `unit: '${current.unit}'`)
        .replace('range: [0, 100]', `range: ${current.range}`);

      ruleTemplatesPage.openRuleTemplatesTab();

      I.click(ruleTemplatesPage.buttons.openAddTemplateModal);
      I.fillField(ruleTemplatesPage.fields.templateInput, newFileContent);
      I.click(ruleTemplatesPage.buttons.addTemplate);
      if (current.unit !== '*') {
        I.verifyPopUpMessage(ruleTemplatesPage.messages.successfullyAdded);

        // Check that Edit and Delete buttons are enabled
        I.waitForEnabled(editButton);
        I.waitForEnabled(deleteButton);

        await templatesAPI.removeTemplate(id);
      } else {
        I.verifyPopUpMessage(ruleTemplatesPage.messages.failedToParse);
      }
    },
  );

Data(templates)
  .Scenario(
    'PMM-T482 PMM-T499 PMM-T766 PMM-T758 PMM-T766 PMM-T767 PMM-T931 Upload rule templates @alerting-fb',
    async ({ I, ruleTemplatesPage, current }) => {
      const { path } = current;
      const validFile = !current.error;
      const [templateName] = await ruleTemplatesPage.ruleTemplate.templateNameAndContent(path);
      const expectedSourceLocator = ruleTemplatesPage
        .getSourceLocator(templateName, ruleTemplatesPage.templateSources.ui);
      const editButton = ruleTemplatesPage.buttons
        .editButtonBySource(ruleTemplatesPage.templateSources.ui);

      ruleTemplatesPage.openRuleTemplatesTab();
      I.click(ruleTemplatesPage.buttons.openAddTemplateModal);
      I.attachFile(ruleTemplatesPage.fields.fileInput, path);
      await ruleTemplatesPage.verifyInputContent(path);
      I.click(ruleTemplatesPage.buttons.addTemplate);

      if (validFile) {
        I.verifyPopUpMessage(ruleTemplatesPage.messages.successfullyAdded);
        I.waitForVisible(expectedSourceLocator, 30);
        I.waitForEnabled(editButton);
      } else {
        I.verifyPopUpMessage(current.error);
      }
    },
  );

Scenario(
  '@PMM-T1785 Bulk rule templates upload @alerting-fb',
  async ({ I, ruleTemplatesPage }) => {
    const path = 'tests/ia/templates/multiple-templates.yml';
    const templates = await ruleTemplatesPage.ruleTemplate.parseTemplates(path);

    ruleTemplatesPage.openRuleTemplatesTab();
    I.click(ruleTemplatesPage.buttons.openAddTemplateModal);
    I.attachFile(ruleTemplatesPage.fields.fileInput, path);
    await ruleTemplatesPage.verifyInputContent(path);
    I.click(ruleTemplatesPage.buttons.addTemplate);
    I.verifyPopUpMessage(ruleTemplatesPage.messages.successfullyAdded);

    for (const { summary: templateName } of templates) {
      const expectedSourceLocator = ruleTemplatesPage
        .getSourceLocator(templateName, ruleTemplatesPage.templateSources.ui);
      const editButton = ruleTemplatesPage.buttons
        .editButtonBySource(ruleTemplatesPage.templateSources.ui);

      I.waitForVisible(expectedSourceLocator, 30);
      I.waitForEnabled(editButton);
    }
  },
);

Scenario(
  '@PMM-T1786 Edit bulk uploaded rule template @alerting-fb',
  async ({ I, ruleTemplatesPage, templatesAPI }) => {
    const path = 'tests/ia/templates/multiple-templates.yml';
    const templates = await ruleTemplatesPage.ruleTemplate.parseTemplates(path);

    await templatesAPI.createRuleTemplate(path);

    for (const templateData of templates) {
      const templateName = templateData.summary;
      const newTemplateName = `${templateName}_updated`;
      const template = YAML.stringify({ templates: [templateData] });

      // Normalizing data due to a library formatting difference
      const yml = template
        .replaceAll(/ +(?= )/g, '')
        .replaceAll(' range:\n'
          + ' - 0\n'
          + ' - 100\n', ' range: [0, 100]\n')
        .replaceAll('unit: "%"', 'unit: \'%\'');

      ruleTemplatesPage.openRuleTemplatesTab();
      ruleTemplatesPage.openEditDialog(templateName);
      await ruleTemplatesPage.verifyRuleTemplateContent(yml);
      const updatedTemplateText = template.replaceAll(templateName, newTemplateName);
      const expectedTemplateText = yml.replaceAll(templateName, newTemplateName);

      I.clearField(ruleTemplatesPage.fields.templateInput);
      I.fillField(ruleTemplatesPage.fields.templateInput, updatedTemplateText);
      I.click(ruleTemplatesPage.buttons.editTemplate);
      I.verifyPopUpMessage(ruleTemplatesPage.messages.successfullyEdited);
      ruleTemplatesPage.openEditDialog(newTemplateName);
      await ruleTemplatesPage.verifyRuleTemplateContent(expectedTemplateText);
    }
  },
);

Scenario(
  '@PMM-T1787 Delete bulk uploaded rule template @alerting-fb',
  async ({ I, ruleTemplatesPage, templatesAPI }) => {
    const path = 'tests/ia/templates/multiple-templates.yml';
    const templates = await ruleTemplatesPage.ruleTemplate.parseTemplates(path);

    await templatesAPI.createRuleTemplate(path);

    for (const { summary: templateName } of templates) {
      const deleteButton = ruleTemplatesPage.buttons
        .deleteButtonByName(templateName);

      ruleTemplatesPage.openRuleTemplatesTab();

      I.waitForElement(deleteButton, 30);
      I.click(deleteButton);
      I.waitForText(
        ruleTemplatesPage.messages.deleteModalHeaderText,
        30,
        ruleTemplatesPage.elements.modalHeader,
      );
      I.seeTextEquals(
        ruleTemplatesPage.messages.deleteModalMessage(templateName),
        locate(ruleTemplatesPage.elements.modalContent).find('h4'),
      );
      I.click(ruleTemplatesPage.buttons.confirmDelete);
      I.verifyPopUpMessage(ruleTemplatesPage.messages.successfullyDeleted(templateName));
      I.dontSeeElement(deleteButton);
    }
  },
);

Scenario(
  'PMM-T501 Upload duplicate rule template @alerting-fb @grafana-pr',
  async ({ I, ruleTemplatesPage, templatesAPI }) => {
    const path = ruleTemplatesPage.ruleTemplate.paths.yaml;
    const [, , id] = await ruleTemplatesPage.ruleTemplate.templateNameAndContent(path);
    const message = ruleTemplatesPage.messages.duplicateTemplate(id);

    await templatesAPI.createRuleTemplate(path);

    ruleTemplatesPage.openRuleTemplatesTab();
    I.click(ruleTemplatesPage.buttons.openAddTemplateModal);
    I.attachFile(ruleTemplatesPage.fields.fileInput, path);
    await ruleTemplatesPage.verifyInputContent(path);
    I.click(ruleTemplatesPage.buttons.addTemplate);
    I.verifyPopUpMessage(message);
  },
);

Scenario(
  'PMM-T483 PMM-T699 Verify user can edit UI-created IA rule template @grafana-pr @alerting-fb',
  async ({ I, ruleTemplatesPage, templatesAPI }) => {
    const path = ruleTemplatesPage.ruleTemplate.paths.yaml;
    const [templateName, fileContent, id] = await ruleTemplatesPage.ruleTemplate
      .templateNameAndContent(path);
    const newTemplateName = 'Updated E2E Template';
    const updatedTemplateText = fileContent.replace(templateName, newTemplateName);

    await templatesAPI.createRuleTemplate(path);

    ruleTemplatesPage.openRuleTemplatesTab();
    ruleTemplatesPage.openEditDialog(templateName);
    await ruleTemplatesPage.verifyRuleTemplateContent(fileContent);
    I.seeElementsDisabled(ruleTemplatesPage.buttons.editTemplate);
    I.clearField(ruleTemplatesPage.fields.templateInput);
    I.fillField(ruleTemplatesPage.fields.templateInput, updatedTemplateText);
    I.waitForEnabled(ruleTemplatesPage.buttons.editTemplate, 10);
    ruleTemplatesPage.verifyEditModalHeaderAndWarning(templateName);
    I.click(ruleTemplatesPage.buttons.editTemplate);
    I.verifyPopUpMessage(ruleTemplatesPage.messages.successfullyEdited);
    ruleTemplatesPage.openEditDialog(newTemplateName);
    await ruleTemplatesPage.verifyRuleTemplateContent(updatedTemplateText);

    // Checking Updated Rule template name in modal header
    ruleTemplatesPage.verifyEditModalHeaderAndWarning(newTemplateName);

    await templatesAPI.removeTemplate(id);
  },
);

Scenario(
  'PMM-T562 Verify user can delete User-defined (UI) rule templates @grafana-pr @alerting-fb',
  async ({ I, ruleTemplatesPage, templatesAPI }) => {
    const path = ruleTemplatesPage.ruleTemplate.paths.yaml;
    const [templateName] = await ruleTemplatesPage.ruleTemplate
      .templateNameAndContent(path);
    const deleteButton = ruleTemplatesPage.buttons
      .deleteButtonByName(templateName);

    await templatesAPI.createRuleTemplate(path);
    ruleTemplatesPage.openRuleTemplatesTab();

    I.waitForElement(deleteButton, 30);
    I.click(deleteButton);
    I.waitForText(
      ruleTemplatesPage.messages.deleteModalHeaderText,
      30,
      ruleTemplatesPage.elements.modalHeader,
    );
    I.seeTextEquals(
      ruleTemplatesPage.messages.deleteModalMessage(templateName),
      locate(ruleTemplatesPage.elements.modalContent).find('h4'),
    );
    I.click(ruleTemplatesPage.buttons.confirmDelete);
    I.verifyPopUpMessage(ruleTemplatesPage.messages.successfullyDeleted(templateName));
    I.dontSeeElement(deleteButton);
  },
);

Scenario(
  'PMM-T884 Verify templates from Percona (SAAS) cannot be deleted or edited @alerting-fb',
  async ({ I, ruleTemplatesPage }) => {
    const saasDeleteButton = ruleTemplatesPage.buttons
      .deleteButtonBySource(ruleTemplatesPage.templateSources.saas);
    const saasEditButton = ruleTemplatesPage.buttons
      .editButtonBySource(ruleTemplatesPage.templateSources.saas);

    ruleTemplatesPage.openRuleTemplatesTab();
    I.waitForElement(saasDeleteButton, 30);
    I.seeAttributesOnElements(saasDeleteButton, { disabled: true });
    I.seeAttributesOnElements(saasEditButton, { disabled: true });
  },
);

Scenario(
  'PMM-T553 Verify rule template can be deleted if there is a rule based on it @alerting-fb',
  async ({
    I, ruleTemplatesPage, templatesAPI, rulesAPI,
  }) => {
    const path = ruleTemplatesPage.ruleTemplate.paths.yaml;
    const [templateName, , id] = await ruleTemplatesPage.ruleTemplate
      .templateNameAndContent(path);
    const deleteButton = ruleTemplatesPage.buttons
      .deleteButtonByName(templateName);

    await templatesAPI.createRuleTemplate(path);
    await rulesAPI.createAlertRule({ ruleName: 'Rule for PMM-T553' }, 'PostgreSQL');
    ruleTemplatesPage.openRuleTemplatesTab();

    I.waitForElement(deleteButton, 30);
    I.click(deleteButton);
    I.click(ruleTemplatesPage.buttons.confirmDelete);
    I.verifyPopUpMessage(ruleTemplatesPage.messages.successfullyDeleted(templateName));
  },
);

Scenario(
  'PMM-T825 PMM-T821 Verify User can add Alert rule template in the file system @not-ovf @alerting-fb',
  async ({ I, ruleTemplatesPage }) => {
    const editButton = ruleTemplatesPage.buttons
      .editButtonBySource(ruleTemplatesPage.templateSources.file);
    const deleteButton = ruleTemplatesPage.buttons
      .deleteButtonBySource(ruleTemplatesPage.templateSources.file);

    await I.verifyCommand('docker cp tests/ia/templates/customParam.yml pmm-server:/srv/alerting/templates');
    await I.verifyCommand('docker cp tests/ia/templates/spaceInParam.yml pmm-server:/srv/alerting/templates');
    await I.verifyCommand('docker cp tests/ia/templates/template.txt pmm-server:/srv/alerting/templates');

    ruleTemplatesPage.openRuleTemplatesTab();
    I.seeElement(editButton);
    I.seeElement(ruleTemplatesPage.buttons.editButtonByName('Custom parameter template'));
    I.dontSeeElement(ruleTemplatesPage.buttons.editButtonByName('Space in parameter'));

    I.seeElementsDisabled(editButton);
    I.seeElementsDisabled(deleteButton);
  },
);

Scenario(
  'PMM-T1126 - Verify there are no Templates from Percona if Telemetry is disabled @alerting-fb',
  async ({ I, settingsAPI, ruleTemplatesPage }) => {
    const editButton = ruleTemplatesPage.buttons
      .editButtonBySource(ruleTemplatesPage.templateSources.saas);
    const deleteButton = ruleTemplatesPage.buttons
      .deleteButtonBySource(ruleTemplatesPage.templateSources.saas);
    const settings = {
      telemetry: false,
      alerting: true,
    };

    await settingsAPI.changeSettings(settings);
    I.amOnPage(ruleTemplatesPage.url);
    I.waitForElement(ruleTemplatesPage.buttons.openAddTemplateModal, 30);
    I.dontSeeElement(editButton);
    I.dontSeeElement(deleteButton);
  },
);

Scenario(
  '@PMM-T1514 Verify that alert rule templates has only 1 exit button @alerting-fb',
  async ({ I, ruleTemplatesPage, alertRulesPage }) => {
    ruleTemplatesPage.openRuleTemplatesTab();
    ruleTemplatesPage.openAddDialog(await I.grabTextFrom(ruleTemplatesPage.elements.templateName));
    I.dontSeeElement('//button[span[text()="Save"]]');
    I.seeElement(alertRulesPage.buttons.saveAndExit);
  },
);
