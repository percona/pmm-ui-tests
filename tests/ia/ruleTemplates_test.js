const assert = require('assert');
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
  'failed to parse rule expression: template: :4: bad character U+0040 \'@\'.']);
templates.add(['tests/ia/templates/spaceInParam.yml',
  'failed to parse rule expression: template: :4: function "old" not defined.']);

Feature('IA: Alert rule templates').retry(1);

Before(async ({
  I, settingsAPI, templatesAPI, rulesAPI,
}) => {
  await I.Authorize();
  await settingsAPI.apiEnableIA();
  await rulesAPI.clearAllRules();
  await templatesAPI.clearAllTemplates();
});

Before(async ({ templatesAPI }) => {
  await templatesAPI.clearAllTemplates();
});

Scenario(
  'PMM-T510 Verify built-in rule templates are non-editable @ia @grafana-pr',
  async ({ I, ruleTemplatesPage }) => {
    const editButton = ruleTemplatesPage.buttons
      .editButtonBySource(ruleTemplatesPage.templateSources.builtin);
    const deleteButton = ruleTemplatesPage.buttons
      .deleteButtonBySource(ruleTemplatesPage.templateSources.builtin);

    ruleTemplatesPage.openRuleTemplatesTab();
    I.waitForVisible(editButton, 30);
    I.seeAttributesOnElements(editButton, { disabled: true });
    I.seeAttributesOnElements(deleteButton, { disabled: true });
  },
);

Scenario(
  'Verify rule templates list elements @ia @grafana-pr',
  async ({ I, ruleTemplatesPage }) => {
    ruleTemplatesPage.openRuleTemplatesTab();
    ruleTemplatesPage.columnHeaders.forEach((header) => {
      const columnHeader = ruleTemplatesPage.elements.columnHeaderLocator(header);

      I.waitForVisible(columnHeader, 30);
    });
    const templateName = await I.grabTextFromAll(ruleTemplatesPage.elements.templateName);

    templateName.forEach((name) => {
      assert.ok(name.length > 0, 'Rule Template name should not be empty');
    });
    I.seeElement(ruleTemplatesPage.buttons.openAddTemplateModal);
  },
);

Scenario(
  'Add rule template modal elements @ia @grafana-pr',
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
    'PMM-T500 PMM-T595 PMM-T596 Add rule templates with different units, empty range @ia',
    async ({
      I, ruleTemplatesPage, templatesAPI, current,
    }) => {
      const [templateName, fileContent, id] = await ruleTemplatesPage.ruleTemplate
        .templateNameAndContent(ruleTemplatesPage.ruleTemplate.inputFilePath);
      const editButton = ruleTemplatesPage.buttons
        .deleteButtonByName(templateName);
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
        I.seeAttributesOnElements(editButton, { disabled: null });
        I.seeAttributesOnElements(deleteButton, { disabled: null });

        await templatesAPI.removeTemplate(id);
      } else {
        I.verifyPopUpMessage(ruleTemplatesPage.messages.failedToParse);
      }
    },
  );

Data(templates)
  .Scenario(
    'PMM-T482 PMM-T499 PMM-T766 PMM-T758 PMM-T766 PMM-T767 PMM-T931 Upload rule templates @ia',
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
        I.seeAttributesOnElements(editButton, { disabled: null });
      } else {
        I.verifyPopUpMessage(current.error);
      }
    },
  );

Scenario(
  'PMM-T501 Upload duplicate rule template @ia @grafana-pr',
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
  'PMM-T483 PMM-T699 Verify user can edit UI-created IA rule template @ia @grafana-pr',
  async ({ I, ruleTemplatesPage, templatesAPI }) => {
    const path = ruleTemplatesPage.ruleTemplate.paths.yaml;
    const [templateName, fileContent, id] = await ruleTemplatesPage.ruleTemplate
      .templateNameAndContent(path);
    const newTemplateName = 'Updated E2E Template';
    const updatedTemplateText = fileContent.replace(templateName, newTemplateName);

    await templatesAPI.createRuleTemplate(path);

    ruleTemplatesPage.openRuleTemplatesTab();
    ruleTemplatesPage.openEditDialog(templateName);
    ruleTemplatesPage.verifyRuleTemplateContent(fileContent);
    I.seeAttributesOnElements(ruleTemplatesPage.buttons.editTemplate, { disabled: true });
    I.clearField(ruleTemplatesPage.fields.templateInput);
    I.fillField(ruleTemplatesPage.fields.templateInput, updatedTemplateText);
    I.seeAttributesOnElements(ruleTemplatesPage.buttons.editTemplate, { disabled: null });
    ruleTemplatesPage.verifyEditModalHeaderAndWarning(templateName);
    I.click(ruleTemplatesPage.buttons.editTemplate);
    I.verifyPopUpMessage(ruleTemplatesPage.messages.successfullyEdited);
    ruleTemplatesPage.openEditDialog(newTemplateName);
    ruleTemplatesPage.verifyRuleTemplateContent(updatedTemplateText);

    // Checking Updated Rule template name in modal header
    ruleTemplatesPage.verifyEditModalHeaderAndWarning(newTemplateName);

    await templatesAPI.removeTemplate(id);
  },
);

Scenario(
  'PMM-T562 Verify user can delete User-defined (UI) rule templates @ia @grafana-pr',
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
  'PMM-T553 Verify rule template can not be deleted if there is a rule based on it @ia',
  async ({
    I, ruleTemplatesPage, templatesAPI, rulesAPI,
  }) => {
    const path = ruleTemplatesPage.ruleTemplate.paths.yaml;
    const [templateName, , id] = await ruleTemplatesPage.ruleTemplate
      .templateNameAndContent(path);
    const deleteButton = ruleTemplatesPage.buttons
      .deleteButtonByName(templateName);

    await templatesAPI.createRuleTemplate(path);
    await rulesAPI.createAlertRule({ ruleName: 'Rule for PMM-T553' }, id);
    ruleTemplatesPage.openRuleTemplatesTab();

    I.waitForElement(deleteButton, 30);
    I.click(deleteButton);
    I.click(ruleTemplatesPage.buttons.confirmDelete);
    I.verifyPopUpMessage(ruleTemplatesPage.messages.failedToDelete(id));
  },
);

Scenario(
  'PMM-T825 PMM-T821 Verify User can add Alert Rule Template in the file system @ia',
  async ({ I, ruleTemplatesPage }) => {
    const editButton = ruleTemplatesPage.buttons
      .editButtonBySource(ruleTemplatesPage.templateSources.file);
    const deleteButton = ruleTemplatesPage.buttons
      .deleteButtonBySource(ruleTemplatesPage.templateSources.file);

    if (process.env.OVF_TEST === 'yes') {
      await I.verifyCommand('sudo cp tests/ia/templates/customParam.yml /srv/ia/templates');
      await I.verifyCommand('sudo cp tests/ia/templates/spaceInParam.yml /srv/ia/templates');
      await I.verifyCommand('sudo cp tests/ia/templates/template.txt /srv/ia/templates');
    } else {
      await I.verifyCommand('docker cp tests/ia/templates/customParam.yml pmm-server:/srv/ia/templates');
      await I.verifyCommand('docker cp tests/ia/templates/spaceInParam.yml pmm-server:/srv/ia/templates');
      await I.verifyCommand('docker cp tests/ia/templates/template.txt pmm-server:/srv/ia/templates');
    }

    ruleTemplatesPage.openRuleTemplatesTab();
    I.seeElement(editButton);
    I.seeElement(ruleTemplatesPage.buttons.editButtonByName('Custom parameter template'));
    I.dontSeeElement(ruleTemplatesPage.buttons.editButtonByName('Space in parameter'));

    I.seeAttributesOnElements(editButton, { disabled: true });
    I.seeAttributesOnElements(deleteButton, { disabled: true });
  },
);
