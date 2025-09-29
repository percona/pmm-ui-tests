Feature('Test specially for upgrading AMI/OVF');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario('PMM-T1111 - Change password before upgrade in AMI/OVF tests @ami-ovf-pre-upgrade', async ({ I, changePasswordPage }) => {
  I.amOnPage(changePasswordPage.url);
  changePasswordPage.fillChangePasswordForm(process.env.ADMIN_PASSWORD, 'newPassword');
  changePasswordPage.applyChanges();
  await I.verifyCommand('export ADMIN_PASSWORD="newPassword"');
});
