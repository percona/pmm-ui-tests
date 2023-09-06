import { test as teardown } from '@playwright/test';
import { api } from '@api/api';
import { portalHelper } from '@helpers/portal-helper';
import { fileHelper } from '@helpers/file-helper';
import constants from '@helpers/constants';

/**
 * Extension point: after Portal tests.
 * Note that there are only 2 ways to pass any artifacts to tests: environment variables and files
 */
teardown('Clean Up Portal tests', async () => {
  await teardown.step('Remove new users and organization', async () => {
    const [firstAdmin, secondAdmin, technicalUser, freeUser] = portalHelper.loadUsersFromFile();
    const adminToken = await api.portal.getUserAccessToken(firstAdmin.email, firstAdmin.password);
    const org = await api.portal.getOrg(adminToken);
    if (org.orgs.length) {
      await api.portal.deleteOrg(adminToken, org.orgs[0].id);
    }
    await api.okta.deleteUsers([firstAdmin, secondAdmin, technicalUser, freeUser]);
  });

  await teardown.step('Remove credentials file if it\'s there', async () => {
    if (fileHelper.fileExists(constants.portal.credentialsFile)) {
      console.log('Found file with Portal test users! Removing...');
      await fileHelper.removeFile(constants.portal.credentialsFile);
    }
  });
});
