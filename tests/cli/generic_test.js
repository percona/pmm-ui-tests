Feature('Generic PMM Server CLI Tests').retry(1);

After(async ({ I }) => {
  await I.verifyCommand('docker rm -f pg-local ubuntu');
});

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

Scenario(
  '@PMM-T1696 Verify that PostgreSQL exporter collects uptime on Ubuntu @cli',
  async ({ I }) => {
    await I.verifyCommand('docker run -dt --add-host host.docker.internal:host-gateway --name ubuntu ubuntu');
    await I.verifyCommand('docker run -d --name pg-local -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -p 5444:5432 postgres:14');

    await I.verifyCommand('docker exec ubuntu apt-get update');
    await I.verifyCommand('docker exec ubuntu apt-get upgrade -y');
    await I.verifyCommand('docker exec ubuntu apt-get install wget curl lsb-release gnupg2 -y');
    console.log(await I.verifyCommand('docker exec ubuntu lsb_release -sc'));
    await I.verifyCommand('docker exec ubuntu wget https://repo.percona.com/apt/percona-release_latest.$(lsb_release -sc)_all.deb');
    await I.verifyCommand('docker exec ubuntu dpkg -i percona-release_latest.$(lsb_release -sc)_all.deb');
    await I.verifyCommand('docker exec ubuntu percona-release enable-only original experimental');
    await I.verifyCommand('docker exec ubuntu apt-get update');
    await I.verifyCommand('docker exec ubuntu apt-get install pmm2-client -y');
    await I.verifyCommand(`docker exec ubuntu pmm-agent setup --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml --server-address=host.docker.internal --server-insecure-tls --server-username=admin --server-password=${process.env.ADMIN_PASSWORD} > /dev/null 2>&1 || true`);
    await I.verifyCommand('docker exec ubuntu pmm-agent --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml > pmm-agent.log 2>&1 &');
    I.wait(5);
    await I.verifyCommand('docker exec ubuntu pmm-admin add postgresql --username=postgres --password=postgres pg-local host.docker.internal:5444');
    const postgresExporterAgentId = await I.verifyCommand('docker exec ubuntu pmm-admin list | grep "postgres_exporter" | awk \'BEGIN { FS = " " } ; { print $4 }\'');

    I.wait(5);
    await I.verifyCommand(`docker exec ubuntu curl -s -u pmm:${postgresExporterAgentId} localhost:42002/metrics | grep "pg_postmaster_uptime_seconds"`,
      'pg_postmaster_uptime_seconds',
      'pass');
  },
);
