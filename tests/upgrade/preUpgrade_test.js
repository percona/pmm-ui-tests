Feature('PMM server pre Upgrade Tests').retry(1);

Scenario(
  'Adding Redis as external Service before Upgrade @pre-external-upgrade',
  async ({
    I, addInstanceAPI,
  }) => {
    await addInstanceAPI.addExternalService('redis_external_remote');
    await I.verifyCommand(
      'pmm-admin add external --listen-port=42200 --group="redis" --custom-labels="testing=redis" --service-name="redis_external_2"',
    );
  },
);
