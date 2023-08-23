import { expect, test as setup } from '@playwright/test';
import { api } from '@api/api';
import { portalHelper } from '@helpers/portal-helper';
import { fileHelper } from '@helpers/file-helper';
import constants from '@helpers/constants';

/**
 * Extension point: before Portal tests.
 * Note that there are only 2 ways to pass any artifacts to tests: environment variables and files
 */
setup('Setup Portal tests', async ({ baseURL }) => {
  await setup.step('Validate environment variables credentials', async () => {
    // TODO: implement non empty check for constants.portal.* constants.okta.* constants.serviceNow.*
    Object.entries(constants.portal).forEach(([key, val]) => {
      expect(val, `Portal tests requires "portal.${key}"!`).toBeTruthy();
    });
    Object.entries(constants.okta).forEach(([key, val]) => {
      expect(val, `Portal tests requires "okta.${key}"!`).toBeTruthy();
    });
    Object.entries(constants.serviceNow).forEach(([key, val]) => {
      expect(val, `Portal tests requires "serviceNow.${key}"!`).toBeTruthy();
    });
  });

  await setup.step('Add pmm-server settings', async () => {
    await api.pmm.settingsV1.changeSettings({ pmm_public_address: baseURL!.replace(/(^\w+:|^)\/\//, '') });
  });
  await setup.step('Remove old credentials file if it\'s there', async () => {
    if (fileHelper.fileExists(constants.portal.credentialsFile)) {
      console.log('Found file with Portal test users! Removing...');
      await fileHelper.removeFile(constants.portal.credentialsFile);
    }
  });
  await setup.step('Generate new users and save to file', async () => {
    const [firstAdmin, secondAdmin, technicalUser, freeUser] = await portalHelper.createNewUsers();
    fileHelper.writeToFile(
      constants.portal.credentialsFile,
      JSON.stringify([firstAdmin, secondAdmin, technicalUser, freeUser]),
    );
  });
});
