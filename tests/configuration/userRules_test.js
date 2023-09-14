/**
 * Note!
 * All tests with changing password must use UI login: {@code loginPage.login();}
 * to keep logout, re-login and restore admin password working.
 */

Feature('PMM User Profile tests');

const INITIAL_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const NEW_ADMIN_PASSWORD = 'admin1';

After(async ({ I, profileAPI }) => {
  // eslint-disable-next-line no-undef
  await tryTo(() => {
    I.Authorize();
    profileAPI.changePassword('admin', process.env.ADMIN_PASSWORD, INITIAL_ADMIN_PASSWORD);
  });
});

Scenario(
  'PMM-T1559 PMM-T1726 Verify editor role is not calling restricted endpoints after login or page refresh @user-roles',
  async ({
    I, loginPage,
  }) => {
    await I.amOnPage(loginPage.url);
    await loginPage.login();
    await I.say('Verify QAN continues to receive data');
  },
);

// PMM-T1795 Verify editor role is not calling restricted endpoints after login or page refresh.
