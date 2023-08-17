import { test as setup } from '@playwright/test';
import { api } from '@api/api';
import { portalHelper } from '@helpers/portalHelper';
import { fileHelper } from '@helpers/fileHelper';
import { Constants } from '@helpers/Constants';

/**
 * Extension point: before Portal tests.
 * Note that there are only 2 ways to pass any artifacts to tests: environment variables and files
 */
setup('Setup Portal tests', async ({ baseURL }) => {
  await setup.step('Add pmm-server settings', async () => {
    await api.pmm.settingsV1.changeSettings({
      pmm_public_address: baseURL!.replace(/(^\w+:|^)\/\//, ''),
    });
  });
  await setup.step('Remove old credentials file if it\'s there', async () => {
    if (fileHelper.fileExists(Constants.portal.credentialsFile)) {
      console.log('Found file with Portal test users! Removing...');
      await fileHelper.removeFile(Constants.portal.credentialsFile);
    }
  });
  await setup.step('Generate new users and save to file', async () => {
    const [firstAdmin, secondAdmin, technicalUser, freeUser] = await portalHelper.createNewUsers();
    fileHelper.writeToFile(
      Constants.portal.credentialsFile,
      JSON.stringify([firstAdmin, secondAdmin, technicalUser, freeUser]),
    );
  });
});
