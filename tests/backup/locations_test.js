const faker = require('faker');

const { locationsPage } = inject();

const location = {
  name: `${faker.lorem.word()}_location`,
  description: 'test description',
  ...locationsPage.storageLocationConnection,
};

const mongoServiceName = 'mongo-backup-locations';

Feature('BM: Backup Locations').retry(1);

BeforeSuite(async ({ I }) => {
  I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0`));
});

Before(async ({
  I, settingsAPI, locationsPage, locationsAPI,
}) => {
  await I.Authorize();
  await settingsAPI.changeSettings({ backup: true });
  await locationsAPI.clearAllLocations(true);
  locationsPage.openLocationsPage();
});

const s3Errors = new DataTable(['field', 'value', 'error']);

s3Errors.add(['bucket_name', 'pmm', 'AccessDenied: Access Denied']);
s3Errors.add(['bucket_name', 'pmm-backup12', 'Bucket doesn\'t exist']);
s3Errors.add(['bucket_name', 'random-bucket', '301 Moved Permanently: 301 Moved Permanently.']);
s3Errors.add(['endpoint', 'unknown', 'no such host']);
s3Errors.add(['access_key', 'invalid', 'InvalidAccessKeyId: The AWS Access Key Id you provided does not exist in our records.']);
s3Errors.add(['secret_key', 'invalid', 'SignatureDoesNotMatch: The request signature we calculated does not match the signature you provided. Check your key and signing method.']);

Scenario(
  'PMM-T691 Verify message about no storage locations @backup',
  async ({
    I, locationsPage,
  }) => {
    I.waitForText(locationsPage.messages.noLocations, 30, locationsPage.elements.noData);
  },
);

Scenario(
  'Verify add storage location modal elements @backup',
  async ({
    I, locationsPage,
  }) => {
    locationsPage.openAddLocationModal();

    // Verify field labels text
    I.seeTextEquals('Name', locationsPage.elements.nameFieldLabel);
    I.seeTextEquals('Description', locationsPage.elements.descriptionFieldLabel);
    I.seeTextEquals('Endpoint', locationsPage.elements.endpointFieldLabel);
    I.seeTextEquals('Bucket Name', locationsPage.elements.bucketFieldLabel);
    I.seeTextEquals('Access Key', locationsPage.elements.accessKeyFieldLabel);
    I.seeTextEquals('Secret Key', locationsPage.elements.secretKeyFieldLabel);
    I.seeTextEquals('Type', locationsPage.elements.typeFieldLabel);

    // Verify S3 is selected
    I.seeAttributesOnElements(
      locationsPage.buttons.typeSelect(locationsPage.locationType.s3),
      { checked: true },
    );
    I.seeAttributesOnElements(
      locationsPage.buttons.typeSelect(locationsPage.locationType.client),
      { checked: null },
    );
    I.seeAttributesOnElements(
      locationsPage.buttons.typeSelect(locationsPage.locationType.server),
      { checked: null },
    );

    // Verify buttons state
    I.seeTextEquals('Add', locationsPage.buttons.addLocation);
    I.seeElementsDisabled(locationsPage.buttons.addLocation);
    I.seeTextEquals('Test', locationsPage.buttons.testLocation);
    I.seeElementsDisabled(locationsPage.buttons.testLocation);
    I.seeTextEquals('Cancel', locationsPage.buttons.cancel);
    I.seeElementsEnabled(locationsPage.buttons.cancel);
  },
);

Scenario(
  'PMM-T696 Verify validation for add storage location modal @backup',
  async ({
    I, locationsPage,
  }) => {
    locationsPage.openAddLocationModal();

    Object.entries(locationsPage.fields)
      .filter(([key]) => key !== 'description')
      .forEach(([, locator]) => {
        I.click(locator);
      });

    I.click(locationsPage.fields.description);

    Object.entries(locationsPage.elements.validation)
      .forEach(([, locator]) => {
        I.seeTextEquals(locationsPage.messages.requiredField, locator);
      });
  },
);

Scenario(
  'PMM-T707 Verify user is able to test connection for storage location @backup',
  async ({
    I, locationsPage,
  }) => {
    locationsPage.openAddLocationModal();

    // Fill required fields
    locationsPage.fillLocationFields(location);

    // Verify buttons become enabled
    I.seeAttributesOnElements(locationsPage.buttons.addLocation, { disabled: null });
    I.seeAttributesOnElements(locationsPage.buttons.testLocation, { disabled: null });

    // Verify Test Connection works
    I.click(locationsPage.buttons.testLocation);
    I.verifyPopUpMessage(locationsPage.messages.successfullyTested);
  },
);

Data(s3Errors).Scenario(
  'PMM-T708 Verify errors related to s3 storage location @backup',
  async ({
    I, locationsPage, current,
  }) => {
    locationsPage.openAddLocationModal();
    locationsPage.fillLocationFields({ ...location, [current.field]: current.value });
    I.click(locationsPage.buttons.testLocation);
    I.verifyPopUpMessage(current.error, 40);
  },
);

Scenario(
  'PMM-T683 PMM-T684 Verify user is able to add storage location @backup @fb',
  async ({
    I, locationsPage,
  }) => {
    locationsPage.openAddLocationModal();

    // Fill required fields
    locationsPage.fillLocationFields(location);

    // Verify success message
    I.click(locationsPage.buttons.addLocation);
    I.verifyPopUpMessage(locationsPage.messages.successfullyAdded);

    // Verify table headers
    I.seeTextEquals('Name', locate('th').at(1));
    I.seeTextEquals('Type', locate('th').at(2));
    I.seeTextEquals('Endpoint or path', locate('th').at(3));
    I.seeTextEquals('Actions', locate('th').at(4));

    // Verify storage location exists in locations list
    I.waitForVisible(locationsPage.buttons.actionsMenuByName(location.name), 2);
    I.click(locationsPage.buttons.actionsMenuByName(location.name));
    I.seeElement(locationsPage.buttons.deleteByName(location.name));
    I.seeElement(locationsPage.buttons.editByName(location.name));
    I.seeTextEquals(locationsPage.locationType.s3, locationsPage.elements.typeCellByName(location.name));
    I.seeTextEquals(location.endpoint, locationsPage.elements.endpointCellByName(location.name));
  },
);

Scenario(
  'PMM-T690 Verify user is not able to add storage location with the same name @backup',
  async ({
    I, locationsPage, locationsAPI,
  }) => {
    await locationsAPI.createStorageLocation(location);
    locationsPage.openLocationsPage();
    locationsPage.openAddLocationModal();

    // Fill required fields
    locationsPage.fillLocationFields(location);

    // Verify success message
    I.click(locationsPage.buttons.addLocation);
    I.verifyPopUpMessage(locationsPage.messages.locationAlreadyExists(location.name));
  },
);

Scenario(
  'PMM-T693 Verify user is able to delete storage location @backup @fb',
  async ({
    I, locationsPage, locationsAPI,
  }) => {
    await locationsAPI.createStorageLocation(location);
    locationsPage.openLocationsPage();
    locationsPage.openDeleteLocationModal(location.name);

    I.waitForText(locationsPage.messages.deleteModalHeaderText, 10, locationsPage.elements.modalHeader);
    I.seeTextEquals(
      locationsPage.messages.confirmDelete(location.name),
      locationsPage.elements.confirmDelete,
    );
    I.seeTextEquals(locationsPage.messages.deleteWarning, locationsPage.elements.deleteWarning);
    I.seeElement(locationsPage.buttons.cancelDelete);
    I.click(locationsPage.buttons.cancelDelete);
    I.dontSeeElement(locationsPage.elements.modalHeader);

    locationsPage.openDeleteLocationModal(location.name);
    I.click(locationsPage.buttons.confirmDelete);
    I.verifyPopUpMessage(locationsPage.messages.successfullyDeleted(location.name));

    I.dontSeeElement(locationsPage.buttons.deleteByName(location.name));
  },
);

Scenario(
  'PMM-T695 Verify user is not able to delete storage location that has backups @backup',
  async ({
    I, locationsPage, locationsAPI, backupAPI, inventoryAPI,
  }) => {
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const location_id = await locationsAPI.createStorageLocation(location);

    await backupAPI.startBackup('delete location', service_id, location_id);
    locationsPage.openLocationsPage();
    locationsPage.openDeleteLocationModal(location.name);
    I.click(locationsPage.buttons.confirmDelete);

    I.verifyPopUpMessage(locationsPage.messages.locationHasArtifacts(location_id));
  },
);

Scenario(
  'PMM-T694 Verify user is able to force delete storage location that has backups @backup',
  async ({
    I, locationsPage, locationsAPI, backupAPI, backupInventoryPage, inventoryAPI,
  }) => {
    const backupName = 'delete location';
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const location_id = await locationsAPI.createStorageLocation(location);

    await backupAPI.startBackup(backupName, service_id, location_id);
    locationsPage.openLocationsPage();
    locationsPage.openDeleteLocationModal(location.name);
    I.forceClick(locationsPage.buttons.forceDeleteCheckbox);
    I.click(locationsPage.buttons.confirmDelete);

    I.verifyPopUpMessage(locationsPage.messages.successfullyDeleted(location.name));
    I.dontSeeElement(locationsPage.buttons.deleteByName(location.name));

    backupInventoryPage.openInventoryPage();
    I.dontSeeElement(backupInventoryPage.buttons.restoreByName(backupName));
  },
);

Scenario(
  'PMM-T692 Verify user is able to edit storage location @backup',
  async ({
    I, locationsPage, locationsAPI,
  }) => {
    const updatedLocation = {
      ...location,
      name: 'updated location',
      description: 'updated description',
    };

    await locationsAPI.createStorageLocation(location);
    locationsPage.openLocationsPage();

    I.click(locationsPage.buttons.actionsMenuByName(location.name));
    I.waitForVisible(locationsPage.buttons.editByName(location.name), 2);
    I.click(locationsPage.buttons.editByName(location.name));

    I.waitForText('Edit', 10, locationsPage.buttons.addLocation);
    I.seeAttributesOnElements(locationsPage.buttons.addLocation, { disabled: true });

    locationsPage.verifyLocationFields(location);

    I.clearField(locationsPage.fields.name);
    I.fillField(locationsPage.fields.name, updatedLocation.name);
    I.fillField(locationsPage.fields.description, updatedLocation.description);

    I.click(locationsPage.buttons.addLocation);
    I.verifyPopUpMessage(locationsPage.messages.successfullyEdited(updatedLocation.name));

    I.click(locationsPage.buttons.actionsMenuByName(updatedLocation.name));
    I.waitForVisible(locationsPage.buttons.editByName(updatedLocation.name), 2);
    I.click(locationsPage.buttons.editByName(updatedLocation.name));
    locationsPage.verifyLocationFields(updatedLocation);
  },
);

Scenario(
  'PMM-T689 Verify user is able see storage location details @backup',
  async ({
    I, locationsPage, locationsAPI,
  }) => {
    await locationsAPI.createStorageLocation(location);
    locationsPage.openLocationsPage();

    // Open details row
    I.click(locationsPage.buttons.showDetails(location.name));

    // Verify storage location details
    I.seeTextEquals(location.description, locationsPage.elements.locationDetails.description);
    I.seeTextEquals(location.bucket_name, locationsPage.elements.locationDetails.bucket);
    I.see(location.access_key, locationsPage.elements.locationDetails.accessKey);
    I.see('*****', locationsPage.elements.locationDetails.secretKey);
    I.click(locationsPage.buttons.showSecret);
    I.see(location.secret_key, locationsPage.elements.locationDetails.secretKey);

    // Hide details
    I.click(locationsPage.buttons.hideDetails(location.name));

    // Verify details row is not visible
    I.dontSeeElement('$storage-location-wrapper');
    I.dontSeeElement(locationsPage.elements.locationDetails.description);
    I.dontSeeElement(locationsPage.elements.locationDetails.bucket);
    I.dontSeeElement(locationsPage.elements.locationDetails.secretKey);
    I.dontSeeElement(locationsPage.elements.locationDetails.accessKey);
  },
);

Scenario(
  'PMM-T896 Verify user is able to force delete location after MongoDB restore @backup',
  async ({
    I, locationsPage, backupAPI, inventoryAPI, locationsAPI, restorePage, backupInventoryPage,
  }) => {
    const mongoLocation = {
      name: 'mongo l',
      description: 'test description',
      ...locationsPage.mongoStorageLocation,
    };

    const locationId = await locationsAPI.createStorageLocation(mongoLocation);

    const backupName = 'mongo force delete locations test';
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const artifactId = await backupAPI.startBackup(backupName, service_id, locationId);

    await backupAPI.waitForBackupFinish(artifactId);
    const restoreId = await backupAPI.startRestore(service_id, artifactId);

    await backupAPI.waitForRestoreFinish(restoreId);

    I.refreshPage();
    locationsPage.openDeleteLocationModal(mongoLocation.name);

    I.waitForVisible(locationsPage.buttons.confirmDelete, 20);
    I.click(locationsPage.buttons.confirmDelete);

    I.verifyPopUpMessage(`backup location with ID "${locationId}" has artifacts.`);

    I.forceClick(locationsPage.buttons.forceDeleteCheckbox);
    I.seeCheckboxIsChecked(locationsPage.buttons.forceDeleteCheckbox);

    I.forceClick(locationsPage.buttons.confirmDelete);
    I.verifyPopUpMessage(locationsPage.messages.successfullyDeleted(mongoLocation.name));
    I.dontSeeElement(locationsPage.buttons.deleteByName(mongoLocation.name));

    I.amOnPage(restorePage.url);
    I.dontSeeElement(restorePage.elements.backupStatusByName(backupName));

    backupInventoryPage.openInventoryPage();
    I.dontSeeElement(backupInventoryPage.elements.backupStatusByName(backupName));
  },
);
