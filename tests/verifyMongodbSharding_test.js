Feature('MongoDB Sharding tests');

const { adminPage } = inject();
const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;

Scenario(
  '@PMM-T1539 Verify that MongoDB exporter shows version for mongos instance @cli',
  async ({
    I,
  }) => {
    const version = '7.0';
    const edition = 'Community';

    const containerName = `psmdb_pmm_${version}_sharded`;
    const agentId = await I.verifyCommand(`docker exec ${containerName} pmm-admin list | grep "42002" | awk -F " " '{print $4}'`);
    const serviceId = await I.verifyCommand(`docker exec ${containerName} pmm-admin list | grep "mongodb_shraded" | awk -F " " '{print $4}'`);
    const port = await I.verifyCommand(`docker exec ${containerName} pmm-admin list | grep "mongodb_exporter.*${serviceId}" | awk -F " " '{print $6}'`);
    const versionInfo = await I.verifyCommand(`docker exec ${containerName} curl --silent -u pmm:${agentId} localhost:${port}/metrics | grep -o "mongodb_version_info{.*}"`);

    const actualEdition = versionInfo.match('(?<=edition=").*?(?=")')[0];
    const actualExactVersion = versionInfo.match('(?<=mongodb=").*?(?=")')[0];

    I.assertEqual(
      actualEdition,
      edition,
      `Expected the Edition of MongoDB to be equal to ${edition} but found ${actualEdition}`,
    );

    await I.assertContain(
      actualExactVersion,
      version,
      `Expected the Version of MongoDB to begin with ${version} but found ${actualExactVersion}`,
    );

    await I.verifyCommand(`docker rm -f ${containerName}`);
  },
);
