const { settingsAPI, contactPointsPage } = inject();
const slackCPName = 'Slack contact point';
const editedCPName = 'Edited CP';

Feature('Alerting: Contact Points');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1703 Verify Slack contact point can be created @ia',
  async ({ I }) => {
    await contactPointsPage.openContactPointsTab();
    await contactPointsPage.createCP(slackCPName, 'Slack');
    I.fillField(contactPointsPage.fields.slackWebhookUrl, slackCPName);
    I.click(contactPointsPage.buttons.saveCP);
    I.verifyPopUpMessage(contactPointsPage.messages.cPCreatedSuccess);
    await contactPointsPage.verifyCPInTable(slackCPName);
  },
);

Scenario(
  'PMM-T1707 Verify Slack contact point can be edited @ia',
  async ({ I }) => {
    await contactPointsPage.openContactPointsTab();
    I.waitForVisible(contactPointsPage.buttons.editCP(2), 10);
    I.click(contactPointsPage.buttons.editCP(2));
    I.waitForVisible(contactPointsPage.elements.cPEditHeader, 10);
    I.fillField(contactPointsPage.fields.cPName, editedCPName);
    I.click(contactPointsPage.buttons.saveCP);
    I.verifyPopUpMessage(contactPointsPage.messages.cPEditedSuccess);
    I.waitForVisible(contactPointsPage.elements.cPTable, 10);
    I.see(editedCPName, contactPointsPage.elements.cPTable);
  },
);

Scenario(
  'PMM-T1706 Verify default contact point cannot be deleted @ia',
  async ({ I }) => {
    await contactPointsPage.openContactPointsTab();
    await contactPointsPage.deleteCP(1);
    I.waitForVisible(contactPointsPage.elements.cannotdeleteCPDialogHeader, 10);
    I.see(contactPointsPage.messages.cPCannotDelete);
    I.click(contactPointsPage.buttons.closeModal);
    I.see('default', contactPointsPage.elements.cPTable);
  },
);

Scenario(
  'PMM-T1704 Verify Slack contact point can be deleted @ia',
  async ({ I }) => {
    await contactPointsPage.openContactPointsTab();
    await contactPointsPage.deleteCP(2);
    I.waitForVisible(contactPointsPage.elements.deleteCPDialogHeader, 10);
    I.see(contactPointsPage.messages.deleteCPConfirm(editedCPName));
    I.click(contactPointsPage.buttons.confirmDeleteCP);
    I.verifyPopUpMessage(contactPointsPage.messages.cPDeletedSuccess);
    I.dontSee(editedCPName, contactPointsPage.elements.cPTable);
  },
);

Scenario(
  'PMM-T1709 Verify Webhook contact point can be created @ia',
  async ({ I }) => {
    const webhook = 'webhook test';

    await contactPointsPage.openContactPointsTab();
    await contactPointsPage.createCP(webhook, 'Webhook');
    I.fillField(contactPointsPage.fields.webhookUrl, webhook);
    I.click(contactPointsPage.buttons.saveCP);
    I.verifyPopUpMessage(contactPointsPage.messages.cPCreatedSuccess);
    await contactPointsPage.verifyCPInTable(webhook);
  },
);

Scenario(
  'PMM-T1710 Verify saving a contact point when required info is missing ', +
  'PMM-T1711 Verify contact point test @ia',
  async ({ I, iaCommon }) => {
    await contactPointsPage.openContactPointsTab();
    I.waitForVisible(contactPointsPage.buttons.newContactPoint, 10);
    I.click(contactPointsPage.buttons.newContactPoint);
    I.waitForVisible(contactPointsPage.buttons.saveCP, 10);
    I.click(contactPointsPage.buttons.saveCP);
    I.verifyPopUpMessage(contactPointsPage.messages.missingRequired);
    I.click(contactPointsPage.fields.cPType);
    I.waitForVisible(iaCommon.elements.selectDropdownOption('PagerDuty'), 10);
    I.click(iaCommon.elements.selectDropdownOption('PagerDuty'));
    I.fillField(contactPointsPage.fields.cPName, 'test');
    I.fillField(contactPointsPage.fields.pagerDutyKey, process.env.PAGER_DUTY_SERVICE_KEY);
    I.click(contactPointsPage.buttons.testCP);
    I.see(contactPointsPage.messages.testNotification, iaCommon.elements.modalDialog);
    I.click(contactPointsPage.buttons.sendTest);
    I.verifyPopUpMessage(contactPointsPage.messages.testSent);
  },
);
