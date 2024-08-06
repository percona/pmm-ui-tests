Feature('Add AMI instance ID.');

Scenario(
  'Add AMI Instance ID on first start of AMI instance.',
  async ({ amiInstanceAPI }) => {
    await amiInstanceAPI.verifyAmazonInstanceId(process.env.AMI_INSTANCE_ID);
  },
);
