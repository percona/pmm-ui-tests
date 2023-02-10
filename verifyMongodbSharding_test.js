Feature('MongoDB Experimental Dashboards tests');

const { adminPage } = inject();
const pmmFrameworkLoader = 'bash /home/nzv/projects/pmm-qa/pmm-tests/pmm-framework.sh';
const connection = {
  // eslint-disable-next-line no-inline-comments
  port: '27017', // This is the port used by --addclient=mo,1 --with-replica --mongomagic
  container_name: 'psmdb_pmm',
};

Scenario(
  'PMM-T1332 - Verify MongoDB - MongoDB Collection Details @dashboards @mongodb-exporter',
  async ({
    I, adminPage, dashboardPage,
  }) => {
    await I.verifyCommand(`${pmmFrameworkLoader} --with-replica --mongomagic --pmm2 --mo-version=4.4`);
    connection.container_name = await I.verifyCommand('docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Names}}" | grep \'psmdb\' | awk -F " " \'{print $3}\'');

    const agentId = await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin list | grep "42002" | awk -F " " '{print $4}'`);
      await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin list | grep "42002" | awk -F " " '{print $4}'`);
    // docker exec psmdb_pmm_6.0_sharded pmm-admin list
    // docker exec psmdb_pmm_6.0_sharded curl --silent -u pmm:/agent_id/0095aa66-85e3-48da-ad40-2c2576759221 localhost:42002/metrics | grep "mongodb_version_info"
  },
);
