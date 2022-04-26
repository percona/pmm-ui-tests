Feature('Generic PMM Server CLI Tests').retry(1);

Scenario(
  'PMM-T1201 Verify yum-cron updates are removed from PMM Server @settings',
  async ({ I }) => {
    const pmm_server = await I.verifyCommand('docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Names}}" | grep \'pmm-server\' | awk \'{print $3}\'');

    await I.verifyCommand(
      `docker exec ${pmm_server} supervisorctl status | grep cron`,
      '',
      'fail',
    );
    await I.verifyCommand(
      `docker exec ${pmm_server} ps aux | grep cron | grep -v grep`,
      '',
      'fail',
    );
  },
);
