Feature('Test AMI login with ID');

Scenario('Test AMI login with ID', async ({ grafanaAPI }) =>{
  await grafanaAPI.login('admin', process.env.AMI_INSTANCE_ID);
});
